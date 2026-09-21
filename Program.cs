//Program.cs
using Microsoft.Data.SqlClient;
using WebsitesOrbcommLocations.Repositories;
using WebsitesOrbcommLocations.Services.Ogws;

var builder = WebApplication.CreateBuilder(args);

// Reuse the local GIS OGWS settings during development when this app has none.
// In deployment, provide Ogws__ServerUrl, Ogws__AccessId and Ogws__Password.
if (builder.Environment.IsDevelopment() && !builder.Configuration.GetSection("Ogws").Exists())
    builder.Configuration.AddJsonFile("GIS/appsettings.json", optional: true);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();
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
app.UseStaticFiles();
app.MapControllers();

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
