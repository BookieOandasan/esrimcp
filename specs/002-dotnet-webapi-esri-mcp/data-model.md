# Data Model: .NET Web API — ESRI MCP Backend

**Feature**: 002-dotnet-webapi-esri-mcp  
**Date**: 2026-06-03

---

## Entities

### AppConfiguration

Server-side configuration loaded at startup. Validated via `ValidateOnStart()`; server refuses to process geocoding requests if `ApiKey` is empty.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `ApiKey` | `string` | Required, non-empty | ArcGIS API key — never in any response |
| `GeocoderUrl` | `string` | Required, valid URI | World Geocoder REST endpoint |
| `TimeoutSeconds` | `int` | 1–60, default 10 | Per-request timeout for ArcGIS calls |
| `AllowedOrigins` | `string[]` | ≥1 entry | CORS allowed origins |

**Config key path**: `Esri:ApiKey`, `Esri:GeocoderUrl`, `Esri:TimeoutSeconds`, `AllowedOrigins`  
**Env var override**: `ESRI__ApiKey` (double-underscore for nested ASP.NET Core convention)

---

### GeocodeRequest

Input to the `geocode_location` MCP tool. Validated before the ArcGIS call is made.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `Query` | `string` | Required, non-empty, ≤512 chars | Place name or address to geocode |

---

### GeocodeResult

Output returned from the `geocode_location` MCP tool to the Angular client.

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `DisplayName` | `string` | No | Formatted address from ArcGIS |
| `Longitude` | `double` | No | WGS84 longitude (x coordinate) |
| `Latitude` | `double` | No | WGS84 latitude (y coordinate) |
| `Score` | `double` | No | Confidence score 0–100 |
| `Extent` | `MapExtent?` | Yes | Bounding box (null for point-only results) |

---

### MapExtent

Bounding box for a geocoded result. Coordinates are in the same spatial reference as the geocoded location (WGS84 / EPSG:4326 by default).

| Field | Type | Description |
|-------|------|-------------|
| `Xmin` | `double` | Western boundary (longitude) |
| `Ymin` | `double` | Southern boundary (latitude) |
| `Xmax` | `double` | Eastern boundary (longitude) |
| `Ymax` | `double` | Northern boundary (latitude) |
| `WkId` | `int` | Spatial reference WKID (default: 4326) |

---

### ToolInvocationLog

Audit record written to the structured log for every `geocode_location` tool call.

| Field | Type | Description |
|-------|------|-------------|
| `Timestamp` | `DateTimeOffset` | UTC time of invocation |
| `ToolName` | `string` | Always `"geocode_location"` |
| `Query` | `string` | Sanitized query (truncated at 512 chars) |
| `ResponseStatus` | `"success" \| "error"` | Outcome of the tool call |
| `DurationMs` | `long` | Wall-clock duration in milliseconds |
| `ErrorMessage` | `string?` | Error detail if status = "error"; null otherwise |

**Important**: `ApiKey` MUST NOT appear in any log field — enforced by never passing it through logging code paths.

---

## Relationships

```
AppConfiguration
  └── used by ArcGisGeocodingService (constructor injection via IOptions<AppConfiguration>)

GeocodeRequest
  └── input to GeocodeTool.GeocodeLocation()
      └── passed to IGeocodingService.GeocodeAsync()
          └── returns GeocodeResult (with optional MapExtent)

ToolInvocationLog
  └── written by GeocodeTool after each IGeocodingService call (success or error)
```

---

## Validation Rules

| Entity | Rule | Error Behaviour |
|--------|------|-----------------|
| `AppConfiguration.ApiKey` | Must be non-empty at startup | App starts but returns MCP error on tool calls |
| `GeocodeRequest.Query` | Must be non-empty, ≤512 chars | Return MCP `invalid_params` error before HTTP call |
| ArcGIS response | Must have ≥1 candidate | Return MCP error "No results found for '{query}'" |
| ArcGIS response | Candidate must have location | Return MCP error "Geocoder returned no coordinates" |

---

## State Transitions

The backend is stateless per-request. The MCP session lifecycle is managed by the `ModelContextProtocol.AspNetCore` SDK automatically.

```
MCP Client connects
  → SDK creates session
    → Tool call arrives
      → GeocodeTool.GeocodeLocation() runs
        → IGeocodingService.GeocodeAsync() calls ArcGIS REST
          → Success → return GeocodeResult as MCP tool result
          → Failure → throw McpException → SDK returns MCP error response
      → ToolInvocationLog written (always)
  → MCP Client disconnects
    → SDK disposes session
```
