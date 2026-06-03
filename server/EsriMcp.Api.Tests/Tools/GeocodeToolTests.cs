using EsriMcp.Api.Models;
using EsriMcp.Api.Services;
using EsriMcp.Api.Tools;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace EsriMcp.Api.Tests.Tools;

public class GeocodeToolTests
{
    private readonly Mock<IGeocodingService> _geocodingServiceMock = new();
    private readonly GeocodeTool _tool;

    public GeocodeToolTests()
    {
        _tool = new GeocodeTool(_geocodingServiceMock.Object, NullLogger<GeocodeTool>.Instance);
    }

    [Fact]
    public async Task GeocodeLocation_ValidQuery_DelegatesToServiceAndReturnsResult()
    {
        var expected = new GeocodeResult
        {
            DisplayName = "Seattle, WA, USA",
            Longitude = -122.3321,
            Latitude = 47.6062,
            Score = 100
        };
        _geocodingServiceMock
            .Setup(s => s.GeocodeAsync("Seattle, WA", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var result = await _tool.GeocodeLocation("Seattle, WA");

        Assert.Equal(expected.DisplayName, result.DisplayName);
        Assert.Equal(expected.Longitude, result.Longitude);
        Assert.Equal(expected.Latitude, result.Latitude);
        Assert.Equal(expected.Score, result.Score);
        _geocodingServiceMock.Verify(s => s.GeocodeAsync("Seattle, WA", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GeocodeLocation_EmptyQuery_ThrowsArgumentExceptionBeforeCallingService()
    {
        await Assert.ThrowsAsync<ArgumentException>(() => _tool.GeocodeLocation(string.Empty));

        _geocodingServiceMock.Verify(s => s.GeocodeAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GeocodeLocation_ServiceThrows_PropagatesException()
    {
        _geocodingServiceMock
            .Setup(s => s.GeocodeAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("No results found for \"xyzzy\""));

        await Assert.ThrowsAsync<InvalidOperationException>(() => _tool.GeocodeLocation("xyzzy"));
    }
}
