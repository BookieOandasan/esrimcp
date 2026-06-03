# MCP Tool Contracts: .NET Web API — ESRI MCP Backend

**Feature**: 002-dotnet-webapi-esri-mcp  
**Transport**: MCP Streamable HTTP (`POST /mcp`)  
**Date**: 2026-06-03

---

## Tool: `geocode_location`

Converts a place name or address string into geographic coordinates. The tool calls the ArcGIS World Geocoder REST API server-side using a securely stored API key.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Place name or address to geocode (e.g. 'Seattle, WA' or '1600 Pennsylvania Ave NW')",
      "minLength": 1,
      "maxLength": 512
    }
  },
  "required": ["query"]
}
```

### Output Schema (success)

```json
{
  "type": "object",
  "properties": {
    "displayName": { "type": "string", "description": "Formatted address returned by geocoder" },
    "longitude":   { "type": "number", "description": "WGS84 longitude (EPSG:4326)" },
    "latitude":    { "type": "number", "description": "WGS84 latitude (EPSG:4326)" },
    "score":       { "type": "number", "description": "Geocoder confidence score (0–100)" },
    "extent": {
      "type": ["object", "null"],
      "description": "Bounding box — null for point-only results",
      "properties": {
        "xmin": { "type": "number" },
        "ymin": { "type": "number" },
        "xmax": { "type": "number" },
        "ymax": { "type": "number" },
        "spatialReference": {
          "type": "object",
          "properties": { "wkid": { "type": "integer" } }
        }
      }
    }
  },
  "required": ["displayName", "longitude", "latitude", "score"]
}
```

### Error Cases

| Condition | MCP Error Code | Message |
|-----------|----------------|---------|
| `query` is empty or missing | `invalid_params` | "query must not be empty" |
| `query` exceeds 512 chars | `invalid_params` | "query must not exceed 512 characters" |
| ArcGIS API key not configured | `internal_error` | "Geocoding service is not configured" |
| ArcGIS returns 0 candidates | `internal_error` | "No results found for \"{query}\"" |
| ArcGIS returns candidate without coordinates | `internal_error` | "Geocoder returned no coordinates for \"{query}\"" |
| ArcGIS HTTP timeout | `internal_error` | "Geocoding request timed out" |
| ArcGIS HTTP error (non-2xx) | `internal_error` | "Geocoding service returned an error" |

### Example Call

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "geocode_location",
    "arguments": { "query": "Seattle, WA" }
  },
  "id": 1
}
```

### Example Success Response

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"displayName\":\"Seattle, WA, USA\",\"longitude\":-122.3321,\"latitude\":47.6062,\"score\":100,\"extent\":{\"xmin\":-122.459,\"ymin\":47.481,\"xmax\":-122.224,\"ymax\":47.734,\"spatialReference\":{\"wkid\":4326}}}"
      }
    ]
  },
  "id": 1
}
```

### Example Error Response

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32603,
    "message": "No results found for \"xyzzy123\""
  },
  "id": 1
}
```

---

## HTTP Endpoint Contract

| Property | Value |
|----------|-------|
| Path | `POST /mcp` |
| Transport | MCP Streamable HTTP (JSON-RPC 2.0 over HTTP with optional SSE) |
| Content-Type | `application/json` |
| CORS | Allowed origins from `AllowedOrigins` config (default: `http://localhost:4200`) |
| Auth | None (rely on CORS + network access control) |

### MCP Initialize Handshake

The Angular MCP client sends an `initialize` request first; the server responds with capabilities listing the `geocode_location` tool. This is handled automatically by the `ModelContextProtocol.AspNetCore` SDK.

```json
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "clientInfo": { "name": "esrimcp-angular", "version": "1.0.0" }
  },
  "id": 0
}
```

Expected server response includes `tools` in `capabilities.tools` confirming `geocode_location` is available.
