namespace EsriMcp.Api.Models;

public sealed class MapExtent
{
    public double Xmin { get; set; }
    public double Ymin { get; set; }
    public double Xmax { get; set; }
    public double Ymax { get; set; }
    public int WkId { get; set; } = 4326;
}
