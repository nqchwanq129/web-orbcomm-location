using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace WebsitesOrbcommLocations.Services.Ogws;

public class OgwsSubmitResult
{
    public bool Success { get; set; }
    public ulong? ForwardMessageID { get; set; }
    public int? ErrorID { get; set; }
    public string? ErrorMessage { get; set; }
}

public interface IOgwsClient
{
    Task<OgwsSubmitResult> SubmitCommandAsync(string mobileId, string commandType, byte? reportValue, byte? sensorIndex, CancellationToken ct = default);
    Task<IReadOnlyList<ForwardMessageStatus>> GetForwardMessageStatusesAsync(IEnumerable<long> messageIds, CancellationToken ct = default);
}

public class OgwsClient : IOgwsClient
{
    private const int Sc1000Sin = 55;

    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = null, PropertyNameCaseInsensitive = true };
    // Token dùng chung giữa các client để tránh xác thực lại liên tục.
    private static readonly SemaphoreSlim TokenLock = new(1, 1);
    private static readonly SemaphoreSlim StatusRequestLock = new(1, 1);
    private static string? _cachedToken;
    private static DateTime _tokenExpiresAtUtc = DateTime.MinValue;

    private readonly HttpClient _http;
    private readonly OgwsOptions _options;
    private readonly OgwsStatusRateLimit _statusRateLimit;

    public OgwsClient(HttpClient http, IOptions<OgwsOptions> options, OgwsStatusRateLimit statusRateLimit)
    {
        _options = options.Value;
        _statusRateLimit = statusRateLimit;
        if (!string.IsNullOrWhiteSpace(_options.ServerUrl))
            http.BaseAddress = new Uri($"{_options.ServerUrl.TrimEnd('/')}/api/v1.0/");
        _http = http;
    }

    public async Task<OgwsSubmitResult> SubmitCommandAsync(string mobileId, string commandType, byte? reportValue, byte? sensorIndex, CancellationToken ct = default)
    {
        if (_http.BaseAddress is null || string.IsNullOrWhiteSpace(_options.AccessId) || string.IsNullOrWhiteSpace(_options.Password))
            return new OgwsSubmitResult { Success = false, ErrorMessage = "Chưa cấu hình kết nối OGWS." };
        var payload = BuildPayload(commandType, reportValue, sensorIndex, out var validationError);
        if (payload == null)
            return new OgwsSubmitResult { Success = false, ErrorMessage = validationError };

        var request = new ForwardMessageRequest { DestinationID = mobileId, Payload = payload };

        try
        {
            var response = await PostWithAuthRetryAsync("submit/messages", new List<ForwardMessageRequest> { request }, ct);
            if (response == null)
                return new OgwsSubmitResult { Success = false, ErrorMessage = "Không nhận được phản hồi từ OGWS." };

            var submission = response.Submissions?.FirstOrDefault();
            if (submission?.ID is null)
            {
                var errorId = submission?.ErrorID ?? response.ErrorID;
                return new OgwsSubmitResult
                {
                    Success = false,
                    ErrorID = errorId,
                    ErrorMessage = errorId == 0
                        ? "OGWS không trả về submission ID."
                        : $"OGWS từ chối lệnh (ErrorID={errorId})."
                };
            }

            return new OgwsSubmitResult
            {
                Success = submission.ErrorID is null or 0,
                ForwardMessageID = submission.ID,
                ErrorID = submission.ErrorID
            };
        }
        catch (Exception ex)
        {
            var message = ex.InnerException is null ? ex.Message : $"{ex.Message} ({ex.InnerException.Message})";
            return new OgwsSubmitResult { Success = false, ErrorMessage = message };
        }
    }

    public async Task<IReadOnlyList<ForwardMessageStatus>> GetForwardMessageStatusesAsync(
        IEnumerable<long> messageIds, CancellationToken ct = default)
    {
        var ids = messageIds.Where(id => id > 0).Distinct().ToArray();
        if (ids.Length == 0) return [];
        if (_http.BaseAddress is null || string.IsNullOrWhiteSpace(_options.AccessId) || string.IsNullOrWhiteSpace(_options.Password))
            return [];

        // Tuần tự hóa lần hỏi trạng thái để cùng tuân theo thời gian chờ khi OGWS trả 429.
        await StatusRequestLock.WaitAsync(ct);
        try
        {
            if (_statusRateLimit.RetryAtUtc is not null) return [];

            await EnsureTokenAsync(ct);
            var url = $"get/fw_statuses?IDList={string.Join(',', ids)}";
            using var response = await SendGetAsync(url, ct);
            if (response.StatusCode == HttpStatusCode.Unauthorized)
            {
                // Token có thể bị thu hồi trước hạn; làm mới rồi thử lại một lần.
                await RefreshTokenAsync(ct, force: true);
                using var retry = await SendGetAsync(url, ct);
                if (retry.StatusCode == HttpStatusCode.TooManyRequests)
                    SetStatusRetryAfter(retry);
                retry.EnsureSuccessStatusCode();
                _statusRateLimit.Clear();
                var retried = await retry.Content.ReadFromJsonAsync<GetForwardStatusesResponse>(JsonOptions, ct);
                return retried?.Statuses ?? [];
            }
            if (response.StatusCode == HttpStatusCode.TooManyRequests)
                SetStatusRetryAfter(response);
            response.EnsureSuccessStatusCode();
            _statusRateLimit.Clear();
            var result = await response.Content.ReadFromJsonAsync<GetForwardStatusesResponse>(JsonOptions, ct);
            return result?.Statuses ?? [];
        }
        finally
        {
            StatusRequestLock.Release();
        }
    }

    private void SetStatusRetryAfter(HttpResponseMessage response)
    {
        // Nếu OGWS không gửi Retry-After, chờ hai phút trước lần hỏi tiếp theo.
        var now = DateTimeOffset.UtcNow;
        var retryAfter = response.Headers.RetryAfter;
        _statusRateLimit.PauseUntil(retryAfter?.Date
            ?? now.Add(retryAfter?.Delta ?? TimeSpan.FromMinutes(2)));
    }

    private async Task<HttpResponseMessage> SendGetAsync(string url, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _cachedToken);
        return await _http.SendAsync(request, ct);
    }

    private static CommonMessage? BuildPayload(string commandType, byte? reportValue, byte? sensorIndex, out string? validationError)
    {
        validationError = null;
        var payload = new CommonMessage { Name = commandType, SIN = Sc1000Sin };

        switch (commandType)
        {
            case "requestReport":
                if (reportValue is null)
                {
                    validationError = "requestReport cần trường ReportValue.";
                    return null;
                }
                payload.MIN = 9;
                payload.Fields.Add(new CommonMessageField { Name = "reportValue", Value = reportValue.Value.ToString() });
                break;

            case "getSensor":
                if (sensorIndex is null)
                {
                    validationError = "getSensor cần trường SensorIndex.";
                    return null;
                }
                payload.MIN = 42;
                payload.Fields.Add(new CommonMessageField { Name = "index", Value = sensorIndex.Value.ToString() });
                break;

            case "resetDistressAlert":
                payload.MIN = 49;
                break;

            case "getConfigSummary":
                payload.MIN = 52;
                break;

            case "distressAlertAck":
                payload.MIN = 39;
                break;

            default:
                validationError = $"CommandType '{commandType}' không được hỗ trợ.";
                return null;
        }

        return payload;
    }

    private async Task<SubmitMessagesResponse?> PostWithAuthRetryAsync<TBody>(string url, TBody body, CancellationToken ct)
    {
        await EnsureTokenAsync(ct);
        using var firstResponse = await SendPostAsync(url, body, ct);

        if (firstResponse.StatusCode == HttpStatusCode.Unauthorized)
        {
            await RefreshTokenAsync(ct, force: true);
            using var retryResponse = await SendPostAsync(url, body, ct);
            retryResponse.EnsureSuccessStatusCode();
            return await retryResponse.Content.ReadFromJsonAsync<SubmitMessagesResponse>(JsonOptions, ct);
        }

        firstResponse.EnsureSuccessStatusCode();
        return await firstResponse.Content.ReadFromJsonAsync<SubmitMessagesResponse>(JsonOptions, ct);
    }

    private async Task<HttpResponseMessage> SendPostAsync<TBody>(string url, TBody body, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = JsonContent.Create(body, options: JsonOptions)
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _cachedToken);
        return await _http.SendAsync(request, ct);
    }

    private async Task EnsureTokenAsync(CancellationToken ct)
    {
        if (_cachedToken != null && DateTime.UtcNow < _tokenExpiresAtUtc)
            return;
        await RefreshTokenAsync(ct);
    }

    private async Task RefreshTokenAsync(CancellationToken ct, bool force = false)
    {
        await TokenLock.WaitAsync(ct);
        try
        {
            if (!force && _cachedToken != null && DateTime.UtcNow < _tokenExpiresAtUtc)
                return;

            var form = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["client_id"] = _options.AccessId,
                ["client_secret"] = _options.Password,
                ["grant_type"] = "client_credentials",
                ["expires_in"] = "3600"
            });

            using var response = await _http.PostAsync("auth/token", form, ct);
            response.EnsureSuccessStatusCode();
            var token = await response.Content.ReadFromJsonAsync<GetTokenResponse>(cancellationToken: ct);

            _cachedToken = token?.AccessToken;
            // Làm mới sớm một phút để tránh dùng token ngay sát thời điểm hết hạn.
            _tokenExpiresAtUtc = DateTime.UtcNow.AddSeconds((token?.ExpiresIn ?? 3600) - 60);
        }
        finally
        {
            TokenLock.Release();
        }
    }
}

