namespace WebsitesOrbcommLocations.Services.Ogws;

public sealed class OgwsStatusRateLimit
{
    private long _retryAtUtcTicks;

    public DateTimeOffset? RetryAtUtc
    {
        get
        {
            var ticks = Interlocked.Read(ref _retryAtUtcTicks);
            if (ticks == 0) return null;
            var retryAt = new DateTimeOffset(ticks, TimeSpan.Zero);
            return retryAt > DateTimeOffset.UtcNow ? retryAt : null;
        }
    }

    public void PauseUntil(DateTimeOffset retryAtUtc) =>
        Interlocked.Exchange(ref _retryAtUtcTicks, retryAtUtc.UtcTicks);

    public void Clear() => Interlocked.Exchange(ref _retryAtUtcTicks, 0);
}
