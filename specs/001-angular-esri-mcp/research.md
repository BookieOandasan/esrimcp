# Research: Angular Web App with ESRI MCP Connection

**Date**: 2026-06-03
**Branch**: `001-angular-esri-mcp`

---

## Decision 1: MCP Client in a Browser Angular Application

**Decision**: Use `@modelcontextprotocol/sdk` (official Anthropic MCP TypeScript SDK)
with `StreamableHTTPClientTransport` for HTTP/SSE transport to the ESRI MCP server.

**Rationale**: The MCP SDK ships a browser-compatible client. Angular services wrap the
`Client` class from `@modelcontextprotocol/sdk/client/index.js`. The
`StreamableHTTPClientTransport` connects over HTTP with Server-Sent Events for streaming
responses — suitable for browser environments without requiring WebSocket support on the
server. The client exposes `callTool()` which returns typed response objects.

**Alternatives considered**:
- WebSocket transport (`WebSocketClientTransport`): Requires server-side WebSocket support;
  adds deployment complexity. Rejected for initial implementation.
- Direct ArcGIS REST API calls: Violates Constitution Principle III (ESRI MCP Integration).
  All geospatial ops MUST go through MCP. Rejected.

---

## Decision 2: ArcGIS Map Rendering in Angular 17+

**Decision**: Use `@arcgis/core` 4.x ESM build with Angular 17+ standalone components.
The `MapService` initializes an ArcGIS `MapView` inside a component host element via
`ngAfterViewInit`, destroys it in `ngOnDestroy`.

**Rationale**: `@arcgis/core` is the official tree-shakeable ESM package. It works
with Angular CLI's Webpack/esbuild pipeline with `allowSyntheticDefaultImports: true`
in `tsconfig.json`. The `esriConfig.apiKey` global is set once at startup from the
runtime config; all subsequent map/service calls automatically use it.

**Alternatives considered**:
- `@arcgis/map-components` (web components): Simpler API but less control over lifecycle
  and reactive data binding. Harder to test with Jasmine. Rejected for initial
  implementation but noted as a future simplification opportunity.
- Leaflet + ESRI plugin: Not MCP-based; violates Constitution Principle III. Rejected.

---

## Decision 3: API Key Runtime Injection (Never Build-Time)

**Decision**: Serve a `/assets/config.json` file that is populated at deploy time and
is excluded from version control via `.gitignore`. The `ConfigService` fetches this file
via `APP_INITIALIZER` on app bootstrap, making the API key available before any component
renders. The `esriConfig.apiKey` is set immediately after load.

**Rationale**: Angular's `environment.ts` bakes values into the compiled bundle at build
time — unacceptable for secrets per Constitution and FR-004. Runtime config via HTTP fetch
keeps the key out of source, build artifacts, and CDN cache. The config file can be
populated by a container entrypoint script at deploy time.

Template (`assets/config.json.template`):
```json
{
  "esriApiKey": "${ESRI_API_KEY}"
}
```

The real `assets/config.json` is gitignored. CI/CD populates it before serving.

**Alternatives considered**:
- `environment.ts` + Angular fileReplacements: Key ends up in JS bundle. Rejected.
- Server-side rendering (SSR) with env var injection: Adds backend complexity. Out of scope.
- Cookie/header injection from a proxy: Requires a reverse proxy; adds deployment
  complexity for a purely static SPA. Rejected for now.

---

## Decision 4: Bootstrap 5.x Integration with ArcGIS CSS

**Decision**: Import Bootstrap SCSS via `styles.scss` using `@use 'bootstrap'` after
customizing variables. ArcGIS CSS is imported separately via the `@arcgis/core/assets`
path alias. Scope ArcGIS widget styles to the map container only to prevent leakage
into Bootstrap-styled UI chrome.

**Rationale**: Bootstrap and ArcGIS both ship global CSS resets. Loading them in the
correct order (Bootstrap → ArcGIS widget styles scoped) prevents conflicts. The ArcGIS
widgets are contained within the `<div id="map-view-container">` which is isolated
from Bootstrap layout.

**Alternatives considered**:
- ng-bootstrap only: ng-bootstrap requires Bootstrap CSS to be loaded globally; compatible.
  ng-bootstrap is used for Angular-native components (modals, tooltips) in addition to raw
  Bootstrap utilities.

---

## Decision 5: State Management — Angular Signals (No NgRx)

**Decision**: Use Angular Signals (introduced in Angular 16, stable in Angular 17) for
reactive state in services (`EsriMcpService`, `MapService`). No NgRx.

**Rationale**: The app has a small, well-defined state surface: session status, current
operation status, error message, loading flag. Angular Signals provide computed/effect
primitives sufficient for this without the boilerplate of NgRx actions/reducers.
`toSignal()` converts Observables from ArcGIS event emitters where needed.

**Alternatives considered**:
- NgRx: Appropriate for larger apps with complex cross-feature state. Overkill here. Rejected.
- BehaviorSubject/Observable only: Valid; Signals are preferred per constitution
  (Angular LTS best practices). Rejected in favor of Signals.

---

## Decision 6: Testing Strategy

**Decision**:
- **Unit tests**: Jasmine + Karma for all Angular services and components. MCP client
  is injected as a dependency and replaced with a typed Jasmine spy in unit tests.
- **Integration/contract tests**: Playwright tests that run against a local MCP server
  stub (`tests/contract/` contains a minimal MCP server fixture that responds with
  canned ESRI tool responses). This satisfies Constitution Principle IV (real MCP
  sessions or contract-level fakes — not mock-only).
- **E2E**: Playwright tests that exercise the full app against a live ESRI MCP server
  (requires `ESRI_API_KEY` in CI environment).

**Alternatives considered**:
- Jest instead of Jasmine: Angular 17 ships Jasmine by default; Jest requires custom
  config. Deferred unless team requests it.
- Cypress instead of Playwright: Both valid; Playwright chosen for its better TS
  support and network interception for MCP call assertions.

---

## Summary of Resolved Unknowns

| Unknown | Resolution |
|---------|-----------|
| MCP transport for browser | StreamableHTTPClientTransport (HTTP/SSE) |
| Map rendering library | @arcgis/core 4.x ESM |
| API key injection mechanism | Runtime /assets/config.json, gitignored |
| CSS conflict between Bootstrap + ArcGIS | Bootstrap global, ArcGIS scoped to container |
| State management | Angular Signals (no NgRx) |
| Testing approach | Jasmine unit + Playwright integration (contract fakes) |
