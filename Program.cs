//Program.cs
using Microsoft.Data.SqlClient;
using WebsitesOrbcommLocations.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();
builder.Services.AddScoped<IDeviceRepository, DeviceRepository>();

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
