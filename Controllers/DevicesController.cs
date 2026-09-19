// Controllers/DevicesController.cs

using Microsoft.AspNetCore.Mvc;
using WebsitesOrbcommLocations.Models;
using WebsitesOrbcommLocations.Repositories;

namespace WebsitesOrbcommLocations.Controllers;

[ApiController]
[Route("api/devices")]

public sealed class DevicesController : ControllerBase
{
    private readonly IDeviceRepository _deviceRepository;


    public DevicesController(IDeviceRepository deviceRepository)
    {
        _deviceRepository = deviceRepository;
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
}