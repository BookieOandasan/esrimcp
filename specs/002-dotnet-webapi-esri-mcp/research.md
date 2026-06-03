# Research: .NET Web API — ESRI MCP Backend

**Feature**: 002-dotnet-webapi-esri-mcp  
**Date**: 2026-06-03  
**Status**: Complete — all unknowns resolved

---

## Decision 1: .NET MCP Server SDK

**Decision**: Use `ModelContextProtocol.AspNetCore` v1.3.0 (official Microsoft/Anthropic C# MCP SDK)

**Rationale**:
- Official open-source SDK maintained jointly by Microsoft and the MCP consortium
- Native ASP.NET Core integration via `AddMcpServer().WithHttpTransport()` + `app.MapMcp()`
- Tool discovery via `[McpServerTool]` attribute + `WithToolsFromAssembly()`
- Supports dependency injection in tool handlers (HttpClient, IOptions, etc.)
- Current stable release: v1.3.0 (NuGet)

**Alternatives considered**:
- Hand-rolling the MCP Streamable HTTP protocol: rejected — unnecessary complexity, SDK handles SSE and JSON-RPC framing
- `ModelContextProtocol` (core only, without AspNetCore): rejected — requires manual HTTP wiring

**Key API surface**:
```csharp
// Program.cs registration
builder.Services.AddMcpServer().WithHttpTransport().WithToolsFromAssembly();
// Route mapping
app.MapMcp("/mcp");

// Tool definition
[McpServerTool, Description("Geocode a place name to coordinates")]
public static async Task<GeocodeResult> GeocodeLocation(
    [Description("Place name or address to geocode")] string query,
    IGeocodingService geocodingService,
    CancellationToken ct)
```

---

## Decision 2: .NET Runtime Version

**Decision**: .NET 9 (current stable release, supported until May 2026; upgrade path to .NET 10 LTS clear)

**Rationale**:
- .NET 8 is LTS but .NET 9 has better minimal API ergonomics and performance improvements
- `ModelContextProtocol.AspNetCore` v1.3.0 supports .NET 8+
- Developer machines likely already have .NET 9 SDK given current tooling

**Alternatives considered**:
- .NET 8 LTS: viable fallback if .NET 9 causes SDK issues; upgrade is trivial (change `<TargetFramework>`)
- .NET 10 preview: rejected — preview SDK adds risk with no benefit for this feature

---

## Decision 3: ArcGIS Geocoding HTTP Call

**Decision**: Use `IHttpClientFactory` with a named client to call the ArcGIS World Geocoder REST API directly from the .NET backend.

**Endpoint**:
```
GET https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates
  ?SingleLine={query}
  &f=json
  &token={apiKey}
  &maxLocations=1
  &outFields=*
```

**Rationale**:
- The ArcGIS API key is passed as the `token` query parameter — standard for ArcGIS API key auth
- `IHttpClientFactory` manages HttpClient lifetimes correctly (avoids socket exhaustion)
- Named client allows centralized base URL and timeout configuration
- Response `candidates[0].location.x` = longitude, `.location.y` = latitude (WGS84/EPSG:4326)

**Alternatives considered**:
- ArcGIS Runtime SDK for .NET: rejected — heavyweight SDK designed for desktop map rendering, not server-side geocoding
- `@arcgis/core` npm package via Node.js subprocess: rejected — wrong runtime entirely

---

## Decision 4: Secure API Key Configuration

**Decision**: Use ASP.NET Core's `IConfiguration` with `IOptions<AppConfiguration>` pattern. Bind `esriApiKey` from `appsettings.json` with environment variable override `ESRI__API_KEY` (ASP.NET Core env var naming convention uses `__` for nested keys).

**Rationale**:
- Built-in ASP.NET Core pattern; no extra packages
- Environment variable `ESRI__API_KEY` overrides `appsettings.json:Esri:ApiKey` automatically
- Startup validation via `ValidateOnStart()` ensures the API fails fast with a clear message if key is missing
- Key never appears in any HTTP response; only used inside `ArcGisGeocodingService`

**appsettings.json structure** (checked in, key value placeholder only):
```json
{
  "Esri": {
    "ApiKey": "",
    "GeocoderUrl": "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates",
    "TimeoutSeconds": 10
  },
  "AllowedOrigins": ["http://localhost:4200"],
  "Logging": { "LogLevel": { "Default": "Information" } }
}
```

---

## Decision 5: CORS Configuration

**Decision**: Configure ASP.NET Core built-in CORS middleware. Policy reads allowed origins from `AllowedOrigins` config array. Default includes `http://localhost:4200` for local Angular dev server.

**Rationale**:
- MCP Streamable HTTP uses standard HTTP requests; browser CORS applies
- Configurable list supports deploying to staging/prod with different origins
- Minimal footprint — no extra package

---

## Decision 6: Test Framework

**Decision**: xUnit v2 + Moq v4 + `Microsoft.AspNetCore.Mvc.Testing` for integration tests

**Rationale**:
- xUnit is the .NET ecosystem standard for unit testing
- Moq provides clean interface mocking for `IGeocodingService`
- `WebApplicationFactory<T>` enables in-process integration testing of the full ASP.NET Core pipeline without network overhead

---

## Decision 7: Angular Frontend Update

**Decision**: Update `public/config.json` (gitignored) to set `mcpServerUrl` to `http://localhost:5000/mcp`. No Angular code changes required — the existing `EsriMcpService` already connects to whatever `mcpServerUrl` is configured.

**Rationale**:
- The Angular MCP client (`@modelcontextprotocol/sdk` + `StreamableHTTPClientTransport`) is already wired; only the URL needs updating
- ASP.NET Core Kestrel defaults to port 5000 for HTTP in development
- `public/config.json.template` gets a comment explaining the new server URL format

**Note**: The ArcGIS API key can now be **removed** from `public/config.json` once the .NET backend is running, since geocoding goes through the backend. The Angular `config.json` will still need `esriApiKey` for direct map tile rendering via `@arcgis/core` (map display, not geocoding). This distinction is maintained.
