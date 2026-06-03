namespace EsriMcp.Api.Models;

public sealed class GeocodeResult
{
    public string DisplayName { get; set; } = string.Empty;
    public double Longitude { get; set; }
    public double Latitude { get; set; }
    public double Score { get; set; }
    public MapExtent? Extent { get; set; }
}
