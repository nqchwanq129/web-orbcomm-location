// Repositories/IDeviceRepository.cs

using WebsitesOrbcommLocations.Models;

namespace WebsitesOrbcommLocations.Repositories;

public interface IDeviceRepository
{
    Task<IReadOnlyList<DevicePosition>> GetLatestPositionsAsync();

    Task<IReadOnlyList<DeviceHistory>> GetDeviceHistoryAsync(
        string? mobileId,
        DateTime? from,
        DateTime? to,
        string? messageType
    );

    Task<DeviceHistoryDetail?> GetDeviceHistoryDetailAsync(long logId);

    Task<IReadOnlyList<DeviceCommand>> GetDeviceCommandsAsync(string mobileId);
    Task<IReadOnlyList<DeviceCommand>> GetPendingDeviceCommandsAsync(long afterCommandId);

    Task<DeviceCommand> SaveDeviceCommandAsync(
        string mobileId,
        string commandType,
        int? reportValue,
        int? sensorIndex,
        string status,
        long? forwardMessageId,
        int? errorId,
        string requestedBy);

    Task UpdateDeviceCommandStatusAsync(long commandId, string status, int? errorId);
}
