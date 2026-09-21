namespace WebsitesOrbcommLocations.Services.Ogws;

/// <summary>Cấu hình kết nối OGWS Gateway; dùng tài khoản sở hữu các thiết bị cần gửi lệnh.</summary>
public class OgwsOptions
{
    public string ServerUrl { get; set; } = "";
    public string AccessId { get; set; } = "";
    public string Password { get; set; } = "";
}

