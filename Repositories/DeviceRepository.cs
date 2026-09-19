//Repositories/DeviceRepository.cs
using Dapper;
using Microsoft.Data.SqlClient;
using WebsitesOrbcommLocations.Models;

namespace WebsitesOrbcommLocations.Repositories;
public sealed class DeviceRepository : IDeviceRepository
{
    private readonly string _connectionString;
    public DeviceRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("TrackingDatabase")
            ?? throw new InvalidOperationException(
                "Connection string 'TrackingDatabase' was not found.");
    }
    public async Task<IReadOnlyList<DevicePosition>> GetLatestPositionsAsync()
    {
        const string sql = """
            SELECT
                MobileID AS MobileId,
                LogID AS LogId,
                MessageUTC AS MessageUtc,
                ReportTimestampUTC AS ReportTimestampUtc,
                MessageTypeName,
                ReportSourceName,
                Latitude,
                Longitude,
                SpeedKmh,
                HeadingDeg,
                MotionState,
                StaleFix,
                BatteryVoltage,
                InternalTemperatureC,
                UpdatedAt
            FROM dbo.DeviceLastPosition
            ORDER BY MobileID;
            """;
        await using var connection = new SqlConnection(_connectionString);
        var devices = await connection.QueryAsync<DevicePosition>(sql);
        return devices.AsList();
    }
}
