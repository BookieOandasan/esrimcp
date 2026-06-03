using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using EsriMcp.Api.Models;
using Microsoft.Extensions.Options;

namespace EsriMcp.Api.Services;

public sealed class ArcGisGeocodingService : IGeocodingService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly AppConfiguration _config;

    public ArcGisGeocodingService(IHttpClientFactory httpClientFactory, IOptions<AppConfiguration> options)
    {
        _httpClientFactory = httpClientFactory;
        _config = options.Value;
    }

    public async Task<GeocodeResult> GeocodeAsync(string query, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_config.ApiKey))
            throw new InvalidOperationException("Geocoding service is not configured");

        var client = _httpClientFactory.CreateClient("arcgis");
        var url = $"{_config.GeocoderUrl}?SingleLine={Uri.EscapeDataString(query)}&f=json&token={_config.ApiKey}&maxLocations=1&outFields=*";

        var response = await client.GetAsync(url, ct);
        response.EnsureSuccessStatusCode();

        var geocoderResponse = await response.Content.ReadFromJsonAsync<ArcGisResponse>(ct)
            ?? throw new InvalidOperationException("Geocoder returned an empty response");

        if (geocoderResponse.Candidates == null || geocoderResponse.Candidates.Length == 0)
            throw new InvalidOperationException($"No results found for \"{query}\"");

        var top = geocoderResponse.Candidates[0];

        return new GeocodeResult
        {
            DisplayName = top.Address ?? query,
            Longitude = top.Location?.X ?? 0,
            Latitude = top.Location?.Y ?? 0,
            Score = top.Score,
            Extent = top.Extent is null ? null : new MapExtent
            {
                Xmin = top.Extent.Xmin,
                Ymin = top.Extent.Ymin,
                Xmax = top.Extent.Xmax,
                Ymax = top.Extent.Ymax,
                WkId = top.Extent.SpatialReference?.WkId ?? 4326
            }
        };
    }

    private sealed class ArcGisResponse
    {
        [JsonPropertyName("candidates")]
        public ArcGisCandidate[]? Candidates { get; set; }
    }

    private sealed class ArcGisCandidate
    {
        [JsonPropertyName("address")]
        public string? Address { get; set; }

        [JsonPropertyName("location")]
        public ArcGisPoint? Location { get; set; }

        [JsonPropertyName("score")]
        public double Score { get; set; }

        [JsonPropertyName("extent")]
        public ArcGisExtent? Extent { get; set; }
    }

    private sealed class ArcGisPoint
    {
        [JsonPropertyName("x")]
        public double X { get; set; }

        [JsonPropertyName("y")]
        public double Y { get; set; }
    }

    private sealed class ArcGisExtent
    {
        [JsonPropertyName("xmin")]
        public double Xmin { get; set; }

        [JsonPropertyName("ymin")]
        public double Ymin { get; set; }

        [JsonPropertyName("xmax")]
        public double Xmax { get; set; }

        [JsonPropertyName("ymax")]
        public double Ymax { get; set; }

        [JsonPropertyName("spatialReference")]
        public ArcGisSpatialReference? SpatialReference { get; set; }
    }

    private sealed class ArcGisSpatialReference
    {
        [JsonPropertyName("wkid")]
        public int WkId { get; set; }
    }
}
