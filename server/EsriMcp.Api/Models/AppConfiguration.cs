namespace EsriMcp.Api.Models;

public sealed class AppConfiguration
{
    public string ApiKey { get; set; } = string.Empty;
    public string GeocoderUrl { get; set; } = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates";
    public int TimeoutSeconds { get; set; } = 10;
    public string[] AllowedOrigins { get; set; } = ["http://localhost:4200"];
}
