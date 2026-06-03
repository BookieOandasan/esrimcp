# Implementation Plan: .NET Web API — ESRI MCP Backend

**Branch**: `002-dotnet-webapi-esri-mcp` | **Date**: 2026-06-03 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/002-dotnet-webapi-esri-mcp/spec.md`

## Summary

Create an ASP.NET Core 9 Web API that implements an MCP (Model Context Protocol) server, exposing a `geocode_location` tool that calls the ArcGIS World Geocoder REST API server-side using a securely stored API key. The Angular frontend's `mcpServerUrl` is updated to point to this backend, so geocoding requests are proxied through the .NET API — the ArcGIS API key is never exposed to the browser for geocoding operations. The existing Angular ArcGIS locator fallback is retained for when the backend is unreachable.

## Technical Context

**Language/Version**: C# 13 / .NET 9  
**Primary Dependencies**: `ModelContextProtocol.AspNetCore` v1.3.0, `Microsoft.Extensions.Http` (IHttpClientFactory), built-in ASP.NET Core CORS middleware  
**Storage**: None — stateless per-request; no database  
**Testing**: xUnit v2, Moq v4, `Microsoft.AspNetCore.Mvc.Testing` (WebApplicationFactory)  
**Target Platform**: Windows/Linux/macOS — local development at `http://localhost:5000`  
**Project Type**: Web service (ASP.NET Core Minimal API + MCP SDK)  
**Performance Goals**: Geocoding end-to-end ≤3 s under normal network conditions (bounded by ArcGIS REST latency); ≥10 concurrent MCP sessions without errors  
**Constraints**: ArcGIS API key must never appear in any HTTP response, log, or header; startup ≤10 s; CORS restricted to configured origins  
**Scale/Scope**: Single-developer local backend; no persistence, no auth between Angular and backend

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design — both pass.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Angular Component Architecture | ✅ PASS | No Angular code changed by this feature. Existing components are untouched. |
| II. Bootstrap-First UI | ✅ N/A | No UI in this feature. Principle applies only to frontend code. |
| III. ESRI MCP Integration | ✅ JUSTIFIED | The .NET backend IS the MCP server implementation. It calls ArcGIS REST internally as the MCP layer itself — this is not bypassing MCP; it IS MCP. The Angular client still accesses geospatial data exclusively via the MCP protocol. Recorded in Complexity Tracking. |
| IV. Test-First Development | ✅ PASS | xUnit tests written before implementation for all services, tool handlers, and integration scenarios. |
| V. Observability & Accessibility | ✅ PASS | Every `geocode_location` tool call produces a structured `ToolInvocationLog` entry. No UI, so WCAG does not apply to this feature. |

## Project Structure

### Documentation (this feature)

```text
specs/002-dotnet-webapi-esri-mcp/
├── plan.md              ← This file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── mcp-tools.md    ← MCP tool + HTTP endpoint contracts
└── tasks.md             ← Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
server/                                      ← NEW: .NET Web API (this feature)
├── EsriMcp.Api/
│   ├── EsriMcp.Api.csproj                  ← net9.0; refs ModelContextProtocol.AspNetCore
│   ├── Program.cs                           ← Minimal API bootstrap: DI, MCP server, CORS, routing
│   ├── appsettings.json                     ← Config skeleton (ApiKey = "", placeholder only — checked in)
│   ├── appsettings.Development.json         ← Dev overrides (empty by default)
│   ├── Models/
│   │   ├── AppConfiguration.cs              ← IOptions-bound config (Esri:ApiKey, AllowedOrigins)
│   │   ├── GeocodeRequest.cs                ← Input model (Query string)
│   │   ├── GeocodeResult.cs                 ← Output model (DisplayName, Lon, Lat, Score, Extent)
│   │   └── MapExtent.cs                     ← Bounding box (Xmin, Ymin, Xmax, Ymax, WkId)
│   ├── Services/
│   │   ├── IGeocodingService.cs             ← Abstraction: GeocodeAsync(query, ct) → GeocodeResult
│   │   └── ArcGisGeocodingService.cs        ← HttpClient impl calling ArcGIS REST API
│   └── Tools/
│       └── GeocodeTool.cs                   ← [McpServerTool] method: GeocodeLocation(query, ...)
│
└── EsriMcp.Api.Tests/
    ├── EsriMcp.Api.Tests.csproj             ← xUnit + Moq + WebApplicationFactory
    ├── Services/
    │   └── ArcGisGeocodingServiceTests.cs   ← Mocked HttpMessageHandler; tests success + error paths
    ├── Tools/
    │   └── GeocodeToolTests.cs              ← Mocked IGeocodingService; tests tool input validation
    └── Integration/
        └── McpEndpointTests.cs              ← WebApplicationFactory; tests /mcp initialize + tool call

src/                                         ← EXISTING: Angular app (no code changes)
public/
├── config.json                              ← Update mcpServerUrl to http://localhost:5000/mcp
└── config.json.template                     ← Update comment; mcpServerUrl placeholder updated
```

**Structure Decision**: Separate `server/` directory at repo root keeps .NET and Angular projects cleanly separated. Both can be run independently. CI can build/test each independently.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principle III: backend calls ArcGIS REST directly | The .NET API IS the MCP server; it must call ArcGIS to implement the geocoding tool | There is no "outer" MCP layer to route through — the backend is the bottom of the MCP stack. Routing from .NET back through itself as an MCP client would be circular. |
