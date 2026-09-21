namespace WebsitesOrbcommLocations.Models;

public sealed class SendDeviceCommandRequest
{
    public string? CommandType { get; set; }
    public int? ReportValue { get; set; }
    public int? SensorIndex { get; set; }
}
