using EsriMcp.Api.Models;

namespace EsriMcp.Api.Services;

public interface IGeocodingService
{
    Task<GeocodeResult> GeocodeAsync(string query, CancellationToken ct = default);
}
