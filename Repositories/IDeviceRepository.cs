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
}