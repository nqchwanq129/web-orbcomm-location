// Controllers/DevicesController.cs

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using WebsitesOrbcommLocations.Models;
using WebsitesOrbcommLocations.Repositories;
using WebsitesOrbcommLocations.Services.Ogws;

namespace WebsitesOrbcommLocations.Controllers;

[ApiController]
[Authorize]
[Route("api/devices")]

public sealed class DevicesController : ControllerBase
{
    private readonly IDeviceRepository _deviceRepository;
    private readonly IOgwsClient _ogwsClient;
    private readonly OgwsStatusRateLimit _statusRateLimit;


    public DevicesController(IDeviceRepository deviceRepository, IOgwsClient ogwsClient, OgwsStatusRateLimit statusRateLimit)
    {
        _deviceRepository = deviceRepository;
        _ogwsClient = ogwsClient;
        _statusRateLimit = statusRateLimit;
    }


    [HttpGet]
    [ProducesResponseType<IReadOnlyList<DevicePosition>>(
        StatusCodes.Status200OK
    )]
    public async Task<ActionResult<IReadOnlyList<DevicePosition>>> GetDevices()
    {
        var devices =
            await _deviceRepository.GetLatestPositionsAsync();

        return Ok(devices);
    }


    [HttpGet("history")]
    [ProducesResponseType<IReadOnlyList<DeviceHistory>>(
        StatusCodes.Status200OK
    )]
    public async Task<ActionResult<IReadOnlyList<DeviceHistory>>> GetHistory(
        [FromQuery] string? mobileId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] string? messageType)
    {
        var history =
            await _deviceRepository.GetDeviceHistoryAsync(
                mobileId,
                from,
                to,
                messageType
            );

        return Ok(history);
    }

    [HttpGet("{mobileId}/commands")]
    [ProducesResponseType<IReadOnlyList<DeviceCommand>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IReadOnlyList<DeviceCommand>>> GetCommands(string mobileId)
    {
        if (string.IsNullOrWhiteSpace(mobileId)) return BadRequest();

        return Ok(await _deviceRepository.GetDeviceCommandsAsync(mobileId));
    }

    [HttpGet("commands/status")]
    public IActionResult GetCommandStatusHealth() => Ok(new
    {
        retryAtUtc = _statusRateLimit.RetryAtUtc
    });

    [HttpPost("{mobileId}/commands")]
    public async Task<IActionResult> SendCommand(
        string mobileId, [FromBody] SendDeviceCommandRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(mobileId)) return BadRequest("Thiếu Mobile ID.");

        var valid = request.CommandType switch
        {
            "requestReport" => request.ReportValue is >= 0 and <= 7 or 9 && request.SensorIndex is null,
            "getSensor" => request.SensorIndex is >= 0 and <= 3 && request.ReportValue is null,
            "resetDistressAlert" or "getConfigSummary" or "distressAlertAck" =>
                request.ReportValue is null && request.SensorIndex is null,
            _ => false
        };
        if (!valid) return BadRequest("Loại lệnh hoặc tham số không hợp lệ.");

        var result = await _ogwsClient.SubmitCommandAsync(
            mobileId, request.CommandType!,
            request.ReportValue is int reportValue ? (byte)reportValue : null,
            request.SensorIndex is int sensorIndex ? (byte)sensorIndex : null,
            cancellationToken);

        var command = await _deviceRepository.SaveDeviceCommandAsync(
            mobileId, request.CommandType!, request.ReportValue, request.SensorIndex,
            result.Success ? "Submitted" : "SubmitFailed",
            result.ForwardMessageID is ulong id && id <= long.MaxValue ? (long)id : null,
            result.ErrorID, User.Identity?.Name ?? "web");

        return Ok(new
        {
            success = result.Success,
            commandId = command.CommandId,
            errorId = result.ErrorID,
            message = result.Success ? "Đã gửi lệnh tới OGWS." : result.ErrorMessage ?? "OGWS từ chối lệnh."
        });
    }

    [HttpGet("history/{logId:long}")]
[ProducesResponseType<DeviceHistoryDetail>(StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public async Task<ActionResult<DeviceHistoryDetail>> GetHistoryDetail(long logId)
{
    var detail = await _deviceRepository.GetDeviceHistoryDetailAsync(logId);

    if (detail is null) {
        return NotFound();
    }

    return Ok(detail);
}
}
