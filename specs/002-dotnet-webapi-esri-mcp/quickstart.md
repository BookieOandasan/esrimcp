# Developer Quickstart: .NET Web API — ESRI MCP Backend

**Feature**: 002-dotnet-webapi-esri-mcp  
**Date**: 2026-06-03

---

## Prerequisites

- .NET 9 SDK (`dotnet --version` should return `9.x.x`)
- Node.js 20+ (for Angular frontend)
- An ArcGIS API key (stored in environment, never in source)

---

## 1. Set Up the Backend

```powershell
# From repo root
cd server/EsriMcp.Api

# Set the ArcGIS API key (PowerShell)
$env:ESRI__ApiKey = "your-arcgis-api-key-here"

# Run the server (listens on http://localhost:5000)
dotnet run
```

Expected output:
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5000
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
```

If `ESRI__ApiKey` is not set, the server starts but geocoding tool calls return a structured MCP error. No crash on startup.

---

## 2. Update Angular Frontend Configuration

Edit `public/config.json` (gitignored — copy from `public/config.json.template` if missing):

```json
{
  "esriApiKey": "your-arcgis-api-key-here",
  "mcpServerUrl": "http://localhost:5000/mcp",
  "mapDefaultCenter": [-98.5795, 39.8283],
  "mapDefaultZoom": 4
}
```

Note: `esriApiKey` in `config.json` is still needed for direct map tile rendering via `@arcgis/core`. Geocoding requests now go through the backend, not the frontend's API key.

---

## 3. Run the Angular Frontend

```powershell
# From repo root
npm start
# Opens at http://localhost:4200
```

The Angular app connects to `http://localhost:5000/mcp` on load. The DevTools console shows:
```
[MCP] Session active — server: http://localhost:5000/mcp
```

---

## 4. Test End-to-End Geocoding

1. Open `http://localhost:4200` in a browser
2. Type "Chicago, IL" in the search box and press Enter
3. The map centers on Chicago
4. In the .NET backend terminal, check the structured log output:
   ```json
   { "timestamp": "2026-06-03T...", "tool": "geocode_location", "query": "Chicago, IL", "responseStatus": "success", "durationMs": 342 }
   ```
5. In browser DevTools → Network tab, confirm: geocoding requests go to `localhost:5000`, NOT to `geocode.arcgis.com`

---

## 5. Run Backend Tests

```powershell
cd server
dotnet test --logger "console;verbosity=normal"
```

All tests should pass. Test coverage includes:
- `GeocodeToolTests` — unit tests with mocked `IGeocodingService`
- `ArcGisGeocodingServiceTests` — unit tests with mocked `HttpMessageHandler`
- `McpEndpointTests` — integration tests via `WebApplicationFactory`

---

## 6. Verify API Key Security

```powershell
# Backend running at http://localhost:5000

# This should return an MCP error, NOT expose the API key
curl -X POST http://localhost:5000/mcp `
  -H "Content-Type: application/json" `
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"geocode_location","arguments":{"query":"test"}},"id":1}'
```

Inspect the response — the API key (`ESRI__ApiKey` value) must not appear anywhere in the body or headers.

---

## 7. Integration Test Scenarios

### Scenario A — Happy Path (US2)
**Given**: Backend running with valid API key, Angular connected  
**When**: User searches "New York, NY"  
**Then**: Map centers on New York; backend log shows `responseStatus: "success"`

### Scenario B — Missing API Key (US3)
**Given**: Backend running with `ESRI__ApiKey` unset  
**When**: Angular MCP session initializes and user searches  
**Then**: Angular shows "Geocoding service is not configured" error banner; map does not crash

### Scenario C — No Results (US2 edge case)
**Given**: Backend running  
**When**: User searches "xyzzy_nonexistent_place_123"  
**Then**: Angular shows "No results found for..." error; no unhandled exception in backend

### Scenario D — Backend Offline (US1)
**Given**: .NET backend not running  
**When**: Angular app loads  
**Then**: Angular MCP session fails silently; app falls back to ArcGIS locator for geocoding; map still renders
