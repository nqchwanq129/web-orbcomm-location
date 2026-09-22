using System.Text.Json;
using System.Text.Json.Serialization;

namespace WebsitesOrbcommLocations.Services;

// SQL lưu giờ UTC nhưng kiểu datetime không kèm thông tin múi giờ.
public sealed class UtcDateTimeJsonConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => reader.GetDateTime();

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        var utc = value.Kind switch
        {
            DateTimeKind.Unspecified => DateTime.SpecifyKind(value, DateTimeKind.Utc),
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => value
        };
        writer.WriteStringValue(utc);
    }
}
