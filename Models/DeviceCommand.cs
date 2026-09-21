namespace WebsitesOrbcommLocations.Models;

public class DeviceCommand
{
  public long CommandId { get; set; }
  public string MobileId { get; set; } = string.Empty;
  public string CommandType { get; set; } = string.Empty;
  public int? ReportValue { get; set; }
  public int? SensorIndex { get; set; }
  public string Status { get; set; } = string.Empty;
  public long? ForwardMessageId { get; set; }
  public int? ErrorId { get; set; }
  public DateTime CreatedAt { get; set; }
  public DateTime? SubmittedAt { get; set; }
  public DateTime? StatusUpdatedAt { get; set; }
  public string? RequestedBy { get; set; }
}