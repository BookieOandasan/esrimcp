# Data Model: Angular Web App with ESRI MCP Connection

**Date**: 2026-06-03
**Branch**: `001-angular-esri-mcp`

---

## Entity: MapView

The primary visual map canvas managed by the `MapService`.

| Field | Type | Description |
|-------|------|-------------|
| `center` | `[number, number]` | `[longitude, latitude]` of the current map center |
| `zoom` | `number` | Zoom level (0–23); default `3` (continental US view) |
| `extent` | `MapExtent` | Bounding box of the current visible area |
| `status` | `MapStatus` | `'uninitialized' \| 'loading' \| 'ready' \| 'error'` |
| `errorMessage` | `string \| null` | Human-readable error if `status === 'error'` |

**MapExtent**:

| Field | Type | Description |
|-------|------|-------------|
| `xmin` | `number` | Western longitude bound |
| `ymin` | `number` | Southern latitude bound |
| `xmax` | `number` | Eastern longitude bound |
| `ymax` | `number` | Northern latitude bound |
| `spatialReference` | `{ wkid: number }` | Coordinate system; default `{ wkid: 4326 }` (WGS84) |

**State transitions**:

```
uninitialized → loading → ready
              → loading → error
```

**Validation rules**:
- `zoom` MUST be in range [0, 23]
- `center` MUST be valid longitude/latitude: longitude ∈ [-180, 180], latitude ∈ [-90, 90]

---

## Entity: EsriMcpSession

Represents the active connection to the ESRI MCP server, managed by `EsriMcpService`.

| Field | Type | Description |
|-------|------|-------------|
| `status` | `SessionStatus` | `'uninitialized' \| 'connecting' \| 'active' \| 'error' \| 'closed'` |
| `serverUrl` | `string` | URL of the ESRI MCP server endpoint (from runtime config) |
| `errorMessage` | `string \| null` | Error detail if `status === 'error'` |
| `connectedAt` | `Date \| null` | Timestamp when session became active |

**State transitions**:

```
uninitialized → connecting → active → closed
              → connecting → error
              active       → error
```

**Validation rules**:
- `serverUrl` MUST be a valid absolute HTTPS URL
- Session MUST be in `active` state before any tool call is dispatched

---

## Entity: GeospatialOperation

A discrete request dispatched to the ESRI MCP server, tracked per invocation.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | UUID v4; unique per operation instance |
| `tool` | `McpToolName` | Name of the MCP tool invoked (e.g., `'geocode_location'`) |
| `inputParams` | `Record<string, unknown>` | Typed parameters for the tool (see contracts/) |
| `status` | `OperationStatus` | `'pending' \| 'success' \| 'error'` |
| `result` | `unknown \| null` | Typed tool result when `status === 'success'` |
| `errorMessage` | `string \| null` | Human-readable error when `status === 'error'` |
| `startedAt` | `Date` | When the operation was dispatched |
| `completedAt` | `Date \| null` | When the operation resolved (success or error) |

**Validation rules**:
- Only one operation per tool type SHOULD be in `pending` state at a time (debounce at UI layer)
- `completedAt` MUST be set when transitioning to `success` or `error`

---

## Entity: AppConfig

Runtime configuration loaded from `/assets/config.json`. Managed by `ConfigService`.

| Field | Type | Description |
|-------|------|-------------|
| `esriApiKey` | `string` | ArcGIS API key; sourced from environment; MUST NOT be empty |
| `mcpServerUrl` | `string` | ESRI MCP server endpoint URL |
| `mapDefaultCenter` | `[number, number]` | Optional; default `[-98.5795, 39.8283]` (geographic center of US) |
| `mapDefaultZoom` | `number` | Optional; default `4` |

**Validation rules**:
- `esriApiKey` MUST be a non-empty string; if missing, app MUST halt with configuration error
- `mcpServerUrl` MUST be a valid absolute URL; if missing, app MUST halt
- Config file MUST NOT be committed to version control

---

## Entity: GeocodeResult

The result of a successful `geocode_location` MCP tool call.

| Field | Type | Description |
|-------|------|-------------|
| `displayName` | `string` | Human-readable place name returned by the service |
| `longitude` | `number` | Longitude of the geocoded point |
| `latitude` | `number` | Latitude of the geocoded point |
| `score` | `number` | Match confidence 0–100; higher is better |
| `extent` | `MapExtent \| null` | Suggested map extent to zoom to (optional) |

---

## Type Summary

```typescript
type MapStatus     = 'uninitialized' | 'loading' | 'ready' | 'error';
type SessionStatus = 'uninitialized' | 'connecting' | 'active' | 'error' | 'closed';
type OperationStatus = 'pending' | 'success' | 'error';
type McpToolName   = 'geocode_location'; // extend as new tools are added
```
