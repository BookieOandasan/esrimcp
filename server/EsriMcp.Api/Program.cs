using EsriMcp.Api.Models;
using EsriMcp.Api.Services;
using EsriMcp.Api.Tools;

var builder = WebApplication.CreateBuilder(args);

var esriConfig = builder.Configuration.GetSection("Esri").Get<AppConfiguration>()
    ?? new AppConfiguration();
esriConfig.AllowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? esriConfig.AllowedOrigins;

builder.Services.Configure<AppConfiguration>(cfg =>
{
    builder.Configuration.GetSection("Esri").Bind(cfg);
    cfg.AllowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
        ?? cfg.AllowedOrigins;
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(esriConfig.AllowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddHttpClient("arcgis", client =>
{
    client.Timeout = TimeSpan.FromSeconds(esriConfig.TimeoutSeconds);
});

builder.Services.AddScoped<IGeocodingService, ArcGisGeocodingService>();

builder.Services
    .AddMcpServer()
    .WithHttpTransport()
    .WithTools<GeocodeTool>();

var app = builder.Build();

app.UseCors();

// The Angular MCP SDK omits "text/event-stream" from Accept — inject it so the MCP transport accepts the request
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/mcp") &&
        !context.Request.Headers.Accept.ToString().Contains("text/event-stream"))
    {
        context.Request.Headers.Accept = "application/json, text/event-stream";
    }
    await next();
});

app.MapMcp("/mcp");

app.Run();

public partial class Program { }
