//Models/DevicePosition.cs
namespace WebsitesOrbcommLocations.Models;

public sealed class DevicePosition
{
    public string MobileId { get; init; } = string.Empty;
    public long LogId { get; init; }
    public DateTime MessageUtc { get; init; }
    public DateTime? ReportTimestampUtc { get; init; }
    public string MessageTypeName { get; init; } = string.Empty;
    public string? ReportSourceName { get; init; }
    public decimal Latitude { get; init; }
    public decimal Longitude { get; init; }
    public byte? SpeedKmh { get; init; }
    public short? HeadingDeg { get; init; }
    public bool? MotionState { get; init; }
    public bool? StaleFix { get; init; }
    public decimal? BatteryVoltage { get; init; }
    public short? InternalTemperatureC { get; init; }
    public DateTime UpdatedAt { get; init; }
    public int? DoorValue { get; init; }
    public int? DoorBatteryLevel { get; init; }
    public DateTime? DoorMessageUtc { get; init; }
    public int? DistressValue { get; init; }
    public int? DistressBatteryLevel { get; init; }
    public DateTime? DistressMessageUtc { get; init; }
}
