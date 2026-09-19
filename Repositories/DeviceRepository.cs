// Repositories/DeviceRepository.cs

using Dapper;
using Microsoft.Data.SqlClient;
using WebsitesOrbcommLocations.Models;

namespace WebsitesOrbcommLocations.Repositories;

public sealed class DeviceRepository : IDeviceRepository
{
    private readonly string _connectionString;


    public DeviceRepository(IConfiguration configuration)
    {
        _connectionString =
            configuration.GetConnectionString("TrackingDatabase")
            ?? throw new InvalidOperationException(
                "Connection string 'TrackingDatabase' was not found."
            );
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


        await using var connection =
            new SqlConnection(_connectionString);


        var devices =
            await connection.QueryAsync<DevicePosition>(
                sql
            );


        return devices.AsList();
    }


    public async Task<IReadOnlyList<DeviceHistory>> GetDeviceHistoryAsync(
        string? mobileId,
        DateTime? from,
        DateTime? to,
        string? messageType)
    {
        const string sql = """
            SELECT
                LogID AS LogId,
                MobileID AS MobileId,
                MessageUTC AS MessageUtc,
                MessageTypeName,
                Latitude,
                Longitude,
                SpeedKmh,
                HeadingDeg,
                MotionState,
                StaleFix,
                BatteryVoltage,
                InternalTemperatureC
            FROM dbo.MessageLog
            WHERE
                (@MobileId IS NULL OR MobileID = @MobileId)

                AND (
                    @From IS NULL
                    OR MessageUTC >= @From
                )

                AND (
                    @To IS NULL
                    OR MessageUTC <= @To
                )

                AND (
                    @MessageType IS NULL
                    OR MessageTypeName = @MessageType
                )

            ORDER BY MessageUTC DESC;
            """;


        await using var connection =
            new SqlConnection(_connectionString);


        var history =
            await connection.QueryAsync<DeviceHistory>(
                sql,
                new
                {
                    MobileId =
                        string.IsNullOrWhiteSpace(mobileId)
                            ? null
                            : mobileId,

                    From = from,

                    To = to,

                    MessageType =
                        string.IsNullOrWhiteSpace(messageType) ||
                        messageType == "all"
                            ? null
                            : messageType
                }
            );


        return history.AsList();
    }

    public async Task<DeviceHistoryDetail?> GetDeviceHistoryDetailAsync(long logId)
{
    const string sql = """
        SELECT
            LogID AS LogId,
            OgwsMessageID AS OgwsMessageId,
            MobileID AS MobileId,
            MessageUTC AS MessageUtc,
            ReceiveUTC AS ReceiveUtc,
            SIN AS Sin,
            MIN AS Min,
            MessageTypeName,
            ReportTimestampUTC AS ReportTimestampUtc,
            ReportSourceCode,
            ReportSourceName,
            BatteryVoltage,
            InternalTemperatureC,
            Latitude,
            Longitude,
            MotionState,
            StaleFix,
            SpeedKmh,
            HeadingDeg,
            ServiceStatus,
            ServiceHours,
            SensorTriggerID AS SensorTriggerId,
            SensorsJson,
            RawGnssJammingValue,
            DroppedMessageCount,
            BlockageDurationSec,
            XAccelerationMg,
            YAccelerationMg,
            ZAccelerationMg,
            ReplySensorIndex,
            ReplySensorName,
            ReplySensorStatus,
            ReplySensorConnected,
            ResetSuccessful,
            ConfigSummaryJson,
            RawPayloadHex,
            PayloadJson,
            CreatedAt
        FROM dbo.MessageLog
        WHERE LogID = @LogId;
        """;

    await using var connection = new SqlConnection(_connectionString);

    return await connection.QuerySingleOrDefaultAsync<DeviceHistoryDetail>(
        sql,
        new { LogId = logId }
    );
}
}