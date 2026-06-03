using System.ComponentModel;
using System.Diagnostics;
using EsriMcp.Api.Models;
using EsriMcp.Api.Services;
using Microsoft.Extensions.Logging;
using ModelContextProtocol.Server;

namespace EsriMcp.Api.Tools;

[McpServerToolType]
public sealed class GeocodeTool(IGeocodingService geocodingService, ILogger<GeocodeTool> logger)
{
    [McpServerTool, Description("Geocode a place name or address to geographic coordinates")]
    public async Task<GeocodeResult> GeocodeLocation(
        [Description("Place name or address to geocode (e.g. 'Seattle, WA')")] string query,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(query))
            throw new ArgumentException("query must not be empty", nameof(query));

        if (query.Length > 512)
            throw new ArgumentException("query must not exceed 512 characters", nameof(query));

        var sw = Stopwatch.StartNew();
        try
        {
            var result = await geocodingService.GeocodeAsync(query, ct);
            sw.Stop();
            logger.LogInformation(
                "MCP tool invocation: {{\"tool\":\"geocode_location\",\"query\":\"{Query}\",\"responseStatus\":\"success\",\"durationMs\":{DurationMs}}}",
                query, sw.ElapsedMilliseconds);
            return result;
        }
        catch (Exception ex)
        {
            sw.Stop();
            logger.LogWarning(
                "MCP tool invocation: {{\"tool\":\"geocode_location\",\"query\":\"{Query}\",\"responseStatus\":\"error\",\"durationMs\":{DurationMs},\"error\":\"{Error}\"}}",
                query, sw.ElapsedMilliseconds, ex.Message);
            throw;
        }
    }
}
