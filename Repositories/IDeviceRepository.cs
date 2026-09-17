//Repositories/IDeviceRepository.cs
using WebsitesOrbcommLocations.Models;

namespace WebsitesOrbcommLocations.Repositories;

public interface IDeviceRepository
{
    Task<IReadOnlyList<DevicePosition>> GetLatestPositionsAsync();
}
