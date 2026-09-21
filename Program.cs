//Program.cs
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using WebsitesOrbcommLocations.Repositories;
using WebsitesOrbcommLocations.Services.Ogws;

var builder = WebApplication.CreateBuilder(args);

// Local development secrets can live in appsettings.Development.local.json.
// In deployment, provide Ogws__ServerUrl, Ogws__AccessId and Ogws__Password.
if (builder.Environment.IsDevelopment() && !builder.Configuration.GetSection("Ogws").Exists())
    builder.Configuration.AddJsonFile("appsettings.Development.local.json", optional: true);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/login.html";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Events.OnRedirectToLogin = context =>
        {
            if (context.Request.Path.StartsWithSegments("/api"))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return Task.CompletedTask;
            }
            context.Response.Redirect(context.RedirectUri);
            return Task.CompletedTask;
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddScoped<IDeviceRepository, DeviceRepository>();
builder.Services.Configure<OgwsOptions>(builder.Configuration.GetSection("Ogws"));
builder.Services.AddHttpClient<IOgwsClient, OgwsClient>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseAuthentication();
app.UseAuthorization();
app.Use(async (context, next) =>
{
    if (context.Request.Path == "/index.html" && context.User.Identity?.IsAuthenticated != true)
    {
        context.Response.Redirect("/login.html");
        return;
    }
    await next();
});
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = context =>
    {
        if (context.File.Name.EndsWith(".js", StringComparison.OrdinalIgnoreCase))
            context.Context.Response.Headers.CacheControl = "no-cache";
    }
});
app.MapControllers();

foreach (var page in new[] { "tracking", "devices", "history", "journey" })
{
    app.MapGet($"/{page}", () => Results.File(
        Path.Combine(app.Environment.WebRootPath, "index.html"), "text/html"))
        .RequireAuthorization();
}

app.MapPost("/api/auth/login", async (LoginRequest request, HttpContext context, IConfiguration configuration) =>
{
    if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrEmpty(request.Password))
        return Results.BadRequest(new { error = "Vui lòng nhập tên đăng nhập và mật khẩu." });

    var connectionString = configuration.GetConnectionString("TrackingDatabase");
    if (string.IsNullOrWhiteSpace(connectionString)) return Results.Problem("Chưa cấu hình cơ sở dữ liệu.");

    await using var connection = new SqlConnection(connectionString);
    await connection.OpenAsync();
    await using var command = new SqlCommand("SELECT TOP (1) Id, UserName, PasswordHash, LockoutEnd FROM AspNetUsers WHERE NormalizedUserName = @username", connection);
    command.Parameters.AddWithValue("@username", request.Username.Trim().ToUpperInvariant());
    await using var reader = await command.ExecuteReaderAsync();
    if (!await reader.ReadAsync()) return Results.Unauthorized();
    var id = reader.GetInt32(0);
    var username = reader.GetString(1);
    var hash = reader.IsDBNull(2) ? null : reader.GetString(2);
    var lockedUntil = reader.IsDBNull(3) ? (DateTimeOffset?)null : reader.GetDateTimeOffset(3);
    if (lockedUntil > DateTimeOffset.UtcNow || hash is null ||
        new PasswordHasher<object>().VerifyHashedPassword(new object(), hash, request.Password) == PasswordVerificationResult.Failed)
        return Results.Unauthorized();

    var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, id.ToString()), new Claim(ClaimTypes.Name, username) }, CookieAuthenticationDefaults.AuthenticationScheme);
    await context.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(identity),
        new Microsoft.AspNetCore.Authentication.AuthenticationProperties { IsPersistent = request.RememberMe, ExpiresUtc = DateTimeOffset.UtcNow.AddHours(request.RememberMe ? 168 : 8) });
    return Results.Ok(new { username });
});

app.MapGet("/api/auth/me", (ClaimsPrincipal user) => Results.Ok(new { username = user.Identity?.Name })).RequireAuthorization();
app.MapPost("/api/auth/logout", async (HttpContext context) =>
{
    await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    return Results.Ok();
}).RequireAuthorization();

app.MapGet("/api/health/database", async (IConfiguration configuration) =>
{
    var connectionString = configuration.GetConnectionString("TrackingDatabase");
    if (string.IsNullOrWhiteSpace(connectionString))
    {
        return Results.Problem(
            title: "Database configuration is missing",
            detail: "Connection string 'TrackingDatabase' was not found.",
            statusCode: StatusCodes.Status500InternalServerError);
    }

    await using var connection = new SqlConnection(connectionString);
    await connection.OpenAsync();
    await using var command = new SqlCommand("SELECT DB_NAME()", connection);
    var databaseName = (string?)await command.ExecuteScalarAsync();
    return Results.Ok(new
    {
        status = "connected",
        database = databaseName
    });
})
.WithName("CheckDatabase")
.WithOpenApi();

app.Run();

record LoginRequest(string Username, string Password, bool RememberMe);
