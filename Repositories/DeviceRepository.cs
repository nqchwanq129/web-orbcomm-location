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
                UpdatedAt,
                door.SensorValue AS DoorValue,
                door.BatteryLevel AS DoorBatteryLevel,
                door.SensorMessageUtc AS DoorMessageUtc,
                distress.SensorValue AS DistressValue,
                distress.BatteryLevel AS DistressBatteryLevel,
                distress.SensorMessageUtc AS DistressMessageUtc
            FROM dbo.DeviceLastPosition AS position
            OUTER APPLY (
                SELECT TOP (1)
                    TRY_CONVERT(int, sensor.SensorValue) AS SensorValue,
                    TRY_CONVERT(int, sensor.BatteryLevel) AS BatteryLevel,
                    log.MessageUTC AS SensorMessageUtc
                FROM dbo.MessageLog AS log
                CROSS APPLY OPENJSON(
                    CASE WHEN ISJSON(log.SensorsJson) = 1 THEN log.SensorsJson ELSE N'[]' END
                ) WITH (
                    SensorType nvarchar(50) '$.typeName',
                    SensorValue nvarchar(50) '$.value',
                    BatteryLevel nvarchar(50) '$.batteryLevel',
                    SensorIndex int '$.index'
                ) AS sensor
                WHERE log.MobileID = position.MobileID AND sensor.SensorType = N'Door'
                ORDER BY log.MessageUTC DESC, log.LogID DESC, sensor.SensorIndex
            ) AS door
            OUTER APPLY (
                SELECT TOP (1)
                    TRY_CONVERT(int, sensor.SensorValue) AS SensorValue,
                    TRY_CONVERT(int, sensor.BatteryLevel) AS BatteryLevel,
                    log.MessageUTC AS SensorMessageUtc
                FROM dbo.MessageLog AS log
                CROSS APPLY OPENJSON(
                    CASE WHEN ISJSON(log.SensorsJson) = 1 THEN log.SensorsJson ELSE N'[]' END
                ) WITH (
                    SensorType nvarchar(50) '$.typeName',
                    SensorValue nvarchar(50) '$.value',
                    BatteryLevel nvarchar(50) '$.batteryLevel',
                    SensorIndex int '$.index'
                ) AS sensor
                WHERE log.MobileID = position.MobileID AND sensor.SensorType = N'DistressButton'
                ORDER BY log.MessageUTC DESC, log.LogID DESC, sensor.SensorIndex
            ) AS distress
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

    public async Task<IReadOnlyList<DeviceCommand>> GetDeviceCommandsAsync(string mobileId)
    {
        const string sql = """
            SELECT TOP (100)
                CommandID AS CommandId, MobileID AS MobileId, CommandType, ReportValue, SensorIndex,
                Status, ForwardMessageID AS ForwardMessageId, ErrorID AS ErrorId, CreatedAt, SubmittedAt,
                StatusUpdatedAt, RequestedBy
            FROM dbo.CommandQueue
            WHERE MobileID = @MobileId
            ORDER BY CreatedAt DESC, CommandID DESC;
            """;

        await using var connection = new SqlConnection(_connectionString);
        var commands = await connection.QueryAsync<DeviceCommand>(sql, new { MobileId = mobileId });
        return commands.AsList();
    }

    public async Task<IReadOnlyList<DeviceCommand>> GetPendingDeviceCommandsAsync(long afterCommandId)
    {
        const string sql = """
            SELECT TOP (50)
                CommandID AS CommandId, MobileID AS MobileId, CommandType, ReportValue, SensorIndex,
                Status, ForwardMessageID AS ForwardMessageId, ErrorID AS ErrorId, CreatedAt, SubmittedAt,
                StatusUpdatedAt, RequestedBy
            FROM dbo.CommandQueue
            WHERE Status = 'Submitted' AND ForwardMessageID IS NOT NULL
              AND CommandID > @AfterCommandId
            ORDER BY CommandID;
            """;

        await using var connection = new SqlConnection(_connectionString);
        var commands = await connection.QueryAsync<DeviceCommand>(sql, new { AfterCommandId = afterCommandId });
        return commands.AsList();
    }

    public async Task<DeviceCommand> SaveDeviceCommandAsync(
        string mobileId, string commandType, int? reportValue, int? sensorIndex,
        string status, long? forwardMessageId, int? errorId, string requestedBy)
    {
        const string sql = """
            INSERT INTO dbo.CommandQueue
                (MobileID, CommandType, ReportValue, SensorIndex, Status,
                 ForwardMessageID, ErrorID, CreatedAt, SubmittedAt, StatusUpdatedAt, RequestedBy)
            OUTPUT INSERTED.CommandID
            VALUES
                (@MobileId, @CommandType, @ReportValue, @SensorIndex, @Status,
                 @ForwardMessageId, @ErrorId, SYSUTCDATETIME(),
                 CASE WHEN @Status = 'Submitted' THEN SYSUTCDATETIME() ELSE NULL END,
                 SYSUTCDATETIME(), @RequestedBy);
            """;

        await using var connection = new SqlConnection(_connectionString);
        var commandId = await connection.ExecuteScalarAsync<long>(sql, new
        {
            MobileId = mobileId, CommandType = commandType, ReportValue = reportValue,
            SensorIndex = sensorIndex, Status = status, ForwardMessageId = forwardMessageId,
            ErrorId = errorId, RequestedBy = requestedBy
        });
        return new DeviceCommand
        {
            CommandId = commandId, MobileId = mobileId, CommandType = commandType,
            ReportValue = reportValue, SensorIndex = sensorIndex, Status = status,
            ForwardMessageId = forwardMessageId, ErrorId = errorId,
            RequestedBy = requestedBy
        };
    }

    public async Task UpdateDeviceCommandStatusAsync(long commandId, string status, int? errorId)
    {
        const string sql = """
            UPDATE dbo.CommandQueue
            SET Status = @Status, ErrorID = @ErrorId, StatusUpdatedAt = SYSUTCDATETIME()
            WHERE CommandID = @CommandId AND Status = 'Submitted';
            """;
        await using var connection = new SqlConnection(_connectionString);
        await connection.ExecuteAsync(sql, new { CommandId = commandId, Status = status, ErrorId = errorId });
    }
}
