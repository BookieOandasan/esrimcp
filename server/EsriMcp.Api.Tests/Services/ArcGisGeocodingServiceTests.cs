using System.Net;
using System.Text;
using System.Text.Json;
using EsriMcp.Api.Models;
using EsriMcp.Api.Services;
using Microsoft.Extensions.Options;
using Moq;
using Moq.Protected;

namespace EsriMcp.Api.Tests.Services;

public class ArcGisGeocodingServiceTests
{
    private static readonly string ValidGeocoderUrl =
        "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates";

    private static ArcGisGeocodingService CreateService(
        HttpMessageHandler handler,
        string apiKey = "test-key")
    {
        var httpClient = new HttpClient(handler);
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient("arcgis")).Returns(httpClient);

        var options = Options.Create(new AppConfiguration
        {
            ApiKey = apiKey,
            GeocoderUrl = ValidGeocoderUrl,
            TimeoutSeconds = 10
        });

        return new ArcGisGeocodingService(factory.Object, options);
    }

    private static HttpMessageHandler FakeHandler(string jsonBody, HttpStatusCode status = HttpStatusCode.OK)
    {
        var mock = new Mock<HttpMessageHandler>();
        mock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage(status)
            {
                Content = new StringContent(jsonBody, Encoding.UTF8, "application/json")
            });
        return mock.Object;
    }

    private static string OneCandidate(
        string address = "Seattle, WA, USA",
        double x = -122.3321,
        double y = 47.6062,
        double score = 100) =>
        JsonSerializer.Serialize(new
        {
            candidates = new[]
            {
                new
                {
                    address,
                    location = new { x, y },
                    score,
                    extent = new
                    {
                        xmin = -122.459,
                        ymin = 47.481,
                        xmax = -122.224,
                        ymax = 47.734,
                        spatialReference = new { wkid = 4326 }
                    }
                }
            }
        });

    [Fact]
    public async Task GeocodeAsync_ValidResponse_ReturnsCorrectGeocodeResult()
    {
        var service = CreateService(FakeHandler(OneCandidate()));

        var result = await service.GeocodeAsync("Seattle, WA");

        Assert.Equal("Seattle, WA, USA", result.DisplayName);
        Assert.Equal(-122.3321, result.Longitude, 4);
        Assert.Equal(47.6062, result.Latitude, 4);
        Assert.Equal(100, result.Score);
        Assert.NotNull(result.Extent);
        Assert.Equal(4326, result.Extent!.WkId);
    }

    [Fact]
    public async Task GeocodeAsync_EmptyCandidates_ThrowsWithNoResultsMessage()
    {
        var emptyResponse = JsonSerializer.Serialize(new { candidates = Array.Empty<object>() });
        var service = CreateService(FakeHandler(emptyResponse));

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.GeocodeAsync("xyzzy_nonexistent"));

        Assert.Contains("No results found", ex.Message);
    }

    [Fact]
    public async Task GeocodeAsync_MissingApiKey_ThrowsWithConfigurationMessage()
    {
        var service = CreateService(FakeHandler(OneCandidate()), apiKey: "");

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.GeocodeAsync("Seattle, WA"));

        Assert.Contains("not configured", ex.Message);
    }

    [Fact]
    public async Task GeocodeAsync_NonSuccessHttpStatus_ThrowsWithErrorMessage()
    {
        var service = CreateService(FakeHandler("{}", HttpStatusCode.InternalServerError));

        await Assert.ThrowsAsync<HttpRequestException>(() =>
            service.GeocodeAsync("Seattle, WA"));
    }

    [Fact]
    public async Task GeocodeAsync_RequestIncludesTokenParameter()
    {
        var capturedRequest = default(HttpRequestMessage);
        var handlerMock = new Mock<HttpMessageHandler>();
        handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .Callback<HttpRequestMessage, CancellationToken>((req, _) => capturedRequest = req)
            .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(OneCandidate(), Encoding.UTF8, "application/json")
            });

        var service = CreateService(handlerMock.Object, apiKey: "MY_TEST_KEY");
        await service.GeocodeAsync("Seattle");

        Assert.NotNull(capturedRequest);
        Assert.Contains("token=MY_TEST_KEY", capturedRequest!.RequestUri!.Query);
    }
}
