using System.Text.Json.Serialization;

namespace WebsitesOrbcommLocations.Services.Ogws;

/// <summary>
/// Các DTO cần cho yêu cầu gửi lệnh SC1000 qua OGWS.
/// </summary>
public class CommonMessageField
{
    public string? Name { get; set; }
    public string? Value { get; set; }
}

public class CommonMessage
{
    public string? Name { get; set; }
    public int SIN { get; set; }
    public int MIN { get; set; }
    public List<CommonMessageField> Fields { get; set; } = [];
}

public class ForwardMessageRequest
{
    public string? DestinationID { get; set; }
    public CommonMessage? Payload { get; set; }
}

public class OgwsResponse
{
    public int ErrorID { get; set; }
}

public class SubmissionDetailResponse
{
    public ulong? ID { get; set; }
    public string? DestinationID { get; set; }
    public int? ErrorID { get; set; }
}

public class SubmitMessagesResponse : OgwsResponse
{
    public List<SubmissionDetailResponse>? Submissions { get; set; }
}

public class ForwardMessageStatus
{
    public ulong? ID { get; set; }
    public int? State { get; set; }
    public int? ErrorID { get; set; }
}

public class GetForwardMessagesResponse : OgwsResponse
{
    public List<ForwardMessageStatus>? Messages { get; set; }
}

public class ErrorCodeInfo
{
    public int ID { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
}

public class ServiceInfoResponse
{
    public List<ErrorCodeInfo>? ErrorCodes { get; set; }
}

public class GetTokenResponse
{
    [JsonPropertyName("token_type")]
    public string? TokenType { get; set; }

    [JsonPropertyName("expires_in")]
    public int? ExpiresIn { get; set; }

    [JsonPropertyName("access_token")]
    public string? AccessToken { get; set; }

    [JsonPropertyName("error")]
    public string? Error { get; set; }
}

