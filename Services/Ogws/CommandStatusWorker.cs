using WebsitesOrbcommLocations.Repositories;

namespace WebsitesOrbcommLocations.Services.Ogws;

public sealed class CommandStatusWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<CommandStatusWorker> logger) : BackgroundService
{
    private static readonly TimeSpan CheckInterval = TimeSpan.FromMinutes(1);
    // Con trỏ giúp duyệt tiếp khi có nhiều lệnh đang chờ.
    private long _lastCommandId;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(CheckInterval);
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var repository = scope.ServiceProvider.GetRequiredService<IDeviceRepository>();
                var ogws = scope.ServiceProvider.GetRequiredService<IOgwsClient>();
                var pending = await repository.GetPendingDeviceCommandsAsync(_lastCommandId);
                if (pending.Count == 0)
                {
                    // Quay về đầu để kiểm tra lại các lệnh cũ chưa có kết quả cuối.
                    _lastCommandId = 0;
                    pending = await repository.GetPendingDeviceCommandsAsync(0);
                }

                if (pending.Count > 0)
                {
                    _lastCommandId = pending[^1].CommandId;
                    var byMessageId = pending.GroupBy(c => c.ForwardMessageId!.Value)
                        .ToDictionary(group => group.Key, group => group.ToArray());
                    var statuses = await ogws.GetForwardMessageStatusesAsync(byMessageId.Keys, stoppingToken);
                    foreach (var status in statuses)
                    {
                        if (status.ID is not ulong id || id > long.MaxValue ||
                            !byMessageId.TryGetValue((long)id, out var commands)) continue;

                        // Chỉ các trạng thái cuối mới được ghi vào CommandQueue.
                        var finalStatus = status.State switch
                        {
                            1 => "Acknowledged",
                            2 => "Error",
                            3 => "Failed",
                            4 => "Timeout",
                            5 => "Canceled",
                            _ => null
                        };
                        if (finalStatus is not null)
                            foreach (var command in commands)
                                await repository.UpdateDeviceCommandStatusAsync(command.CommandId, finalStatus, status.ErrorID);
                    }
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Could not refresh OGWS forward statuses");
            }
            try
            {
                if (!await timer.WaitForNextTickAsync(stoppingToken)) break;
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }
}
