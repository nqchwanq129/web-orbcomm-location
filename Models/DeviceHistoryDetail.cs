namespace WebsitesOrbcommLocations.Models;

public sealed class DeviceHistoryDetail
{
    public long LogId { get; set; }
    public long? OgwsMessageId { get; set; }
    public string MobileId { get; set; } = string.Empty;
    public DateTime MessageUtc { get; set; }
    public DateTime? ReceiveUtc { get; set; }
    public int? Sin { get; set; }
    public int? Min { get; set; }
    public string? MessageTypeName { get; set; }
    public DateTime? ReportTimestampUtc { get; set; }
    public int? ReportSourceCode { get; set; }
    public string? ReportSourceName { get; set; }
    public decimal? BatteryVoltage { get; set; }
    public decimal? InternalTemperatureC { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public bool? MotionState { get; set; }
    public bool? StaleFix { get; set; }
    public decimal? SpeedKmh { get; set; }
    public decimal? HeadingDeg { get; set; }
    public string? ServiceStatus { get; set; }
    public decimal? ServiceHours { get; set; }
    public int? SensorTriggerId { get; set; }
    public string? SensorsJson { get; set; }
    public decimal? RawGnssJammingValue { get; set; }
    public int? DroppedMessageCount { get; set; }
    public int? BlockageDurationSec { get; set; }
    public decimal? XAccelerationMg { get; set; }
    public decimal? YAccelerationMg { get; set; }
    public decimal? ZAccelerationMg { get; set; }
    public int? ReplySensorIndex { get; set; }
    public string? ReplySensorName { get; set; }
    public string? ReplySensorStatus { get; set; }
    public bool? ReplySensorConnected { get; set; }
    public bool? ResetSuccessful { get; set; }
    public string? ConfigSummaryJson { get; set; }
    public string? RawPayloadHex { get; set; }
    public string? PayloadJson { get; set; }
    public DateTime CreatedAt { get; set; }
}