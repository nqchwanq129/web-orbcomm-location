// Models/DeviceHistory.cs

namespace WebsitesOrbcommLocations.Models;

public sealed class DeviceHistory
{
    public string MobileId { get; set; } = string.Empty;

    public DateTime MessageUtc { get; set; }

    public string? MessageTypeName { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public decimal? SpeedKmh { get; set; }

    public decimal? HeadingDeg { get; set; }

    public bool? MotionState { get; set; }

    public bool? StaleFix { get; set; }

    public decimal? BatteryVoltage { get; set; }

    public decimal? InternalTemperatureC { get; set; }
}