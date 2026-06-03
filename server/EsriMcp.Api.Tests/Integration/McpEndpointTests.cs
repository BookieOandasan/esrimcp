using System.Text;
using System.Text.Json;
using EsriMcp.Api.Models;
using EsriMcp.Api.Services;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Moq;

namespace EsriMcp.Api.Tests.Integration;

public class McpEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public McpEndpointTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IGeocodingService));
                if (descriptor != null) services.Remove(descriptor);

                var mock = new Mock<IGeocodingService>();
                mock.Setup(s => s.GeocodeAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
                    .ReturnsAsync(new GeocodeResult
                    {
                        DisplayName = "Seattle, WA, USA",
                        Longitude = -122.3321,
                        Latitude = 47.6062,
                        Score = 100
                    });
                services.AddScoped<IGeocodingService>(_ => mock.Object);
            });
        });
    }

    [Fact]
    public async Task Mcp_Initialize_ReturnsCapabilitiesWithGeocodeTool()
    {
        var client = _factory.CreateClient();
        var sessionId = await InitializeMcpSession(client);
        Assert.NotNull(sessionId);

        var toolsListRequest = new
        {
            jsonrpc = "2.0",
            method = "tools/list",
            @params = new { },
            id = 1
        };

        var response = await client.SendAsync(McpRequest(toolsListRequest, sessionId));
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("geocode_location", body);
    }

    [Fact]
    public async Task Mcp_GeocodeLocationToolCall_ReturnsGeocodeResult()
    {
        var client = _factory.CreateClient();
        var sessionId = await InitializeMcpSession(client);

        var toolCallRequest = new
        {
            jsonrpc = "2.0",
            method = "tools/call",
            @params = new
            {
                name = "geocode_location",
                arguments = new { query = "Seattle, WA" }
            },
            id = 1
        };

        var response = await client.SendAsync(McpRequest(toolCallRequest, sessionId));
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("Seattle", body);
        Assert.Contains("longitude", body, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("latitude", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Mcp_ToolCallResponse_DoesNotContainApiKey()
    {
        const string testApiKey = "TEST_API_KEY_SENTINEL_VALUE_12345";
        var factoryWithKey = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Esri:ApiKey"] = testApiKey
                });
            });
        });

        var client = factoryWithKey.CreateClient();
        var sessionId = await InitializeMcpSession(client);

        var toolCallRequest = new
        {
            jsonrpc = "2.0",
            method = "tools/call",
            @params = new { name = "geocode_location", arguments = new { query = "Chicago" } },
            id = 1
        };

        var response = await client.SendAsync(McpRequest(toolCallRequest, sessionId));
        var body = await response.Content.ReadAsStringAsync();

        Assert.DoesNotContain(testApiKey, body);
    }

    private static HttpRequestMessage McpRequest(object payload, string? sessionId = null)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/mcp");
        request.Headers.Accept.ParseAdd("application/json");
        request.Headers.Accept.ParseAdd("text/event-stream");
        if (sessionId is not null)
            request.Headers.TryAddWithoutValidation("Mcp-Session-Id", sessionId);
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        return request;
    }

    private static async Task<string?> InitializeMcpSession(HttpClient client)
    {
        var initRequest = new
        {
            jsonrpc = "2.0",
            method = "initialize",
            @params = new
            {
                protocolVersion = "2024-11-05",
                clientInfo = new { name = "test", version = "1.0" },
                capabilities = new { }
            },
            id = 0
        };
        var response = await client.SendAsync(McpRequest(initRequest));
        response.Headers.TryGetValues("Mcp-Session-Id", out var values);
        return values?.FirstOrDefault();
    }
}
