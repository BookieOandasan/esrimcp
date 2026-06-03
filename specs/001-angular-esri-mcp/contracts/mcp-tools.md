# MCP Tool Contracts: ESRI MCP

**Date**: 2026-06-03
**Branch**: `001-angular-esri-mcp`

These contracts define the tool call interface between the Angular `EsriMcpService` and
the ESRI MCP server. All invocations use `client.callTool()` from
`@modelcontextprotocol/sdk`.

---

## Tool: `geocode_location`

Resolves a human-readable place name or address to geographic coordinates.

### Input Parameters

```typescript
interface GeocodeLocationInput {
  query: string;   // Place name or address string; MUST be non-empty
}
```

### Output (success)

```typescript
interface GeocodeLocationResult {
  displayName: string;   // Resolved place name
  longitude:   number;   // WGS84 decimal degrees
  latitude:    number;   // WGS84 decimal degrees
  score:       number;   // Match confidence 0–100
  extent?: {             // Optional suggested map extent
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
}
```

### Error conditions

| Code | Meaning | Angular app behavior |
|------|---------|---------------------|
| `NO_MATCH` | No location found for query | Show "No results found" in search bar |
| `INVALID_INPUT` | Empty or invalid query string | Show validation message; do not invoke tool |
| `AUTH_FAILURE` | API key rejected by ESRI | Show auth error banner; log structured error |
| `SERVICE_UNAVAILABLE` | ESRI service unreachable | Show service error banner; map remains functional |

### Structured log format (per Constitution V)

```json
{
  "timestamp": "2026-06-03T12:00:00.000Z",
  "tool": "geocode_location",
  "params": { "query": "Seattle, WA" },
  "responseStatus": "success",
  "durationMs": 342
}
```

---

## Tool: `initialize_map` *(optional, future)*

Reserved for future use if the ESRI MCP server exposes map session initialization as a
tool. Currently, map initialization is handled client-side via `@arcgis/core`. This slot
is documented here so contract consumers can plan for migration.

---

## MCP Session Contract

The `EsriMcpService` MUST manage the MCP session according to this lifecycle:

```
1. APP_INITIALIZER → ConfigService.load() → esriApiKey + mcpServerUrl available
2. EsriMcpService.connect(mcpServerUrl) → creates Client, connects transport
3. Map component OnInit → MapService.initializeMap(apiKey, container)
4. User search → EsriMcpService.callTool('geocode_location', { query })
5. Component OnDestroy → MapService.destroyMap() + EsriMcpService.disconnect()
```

**Invariants**:
- `callTool()` MUST NOT be called while `sessionStatus !== 'active'`
- Each `callTool()` call MUST emit a structured log entry (Principle V)
- MCP tool responses MUST be validated against the expected interface before use;
  if response shape is invalid, treat as `SERVICE_UNAVAILABLE` error
