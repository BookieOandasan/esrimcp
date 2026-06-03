# Implementation Plan: Angular Web App with ESRI MCP Connection

**Branch**: `001-angular-esri-mcp` | **Date**: 2026-06-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-angular-esri-mcp/spec.md`

## Summary

Build an Angular 17+ single-page application that displays an interactive ESRI-powered
map and exposes a geocoding search via the ESRI Model Context Protocol (MCP) client.
The app authenticates with ArcGIS services using an API key loaded at runtime from a
gitignored config file (never baked into the bundle). Bootstrap 5.x provides all layout
and UI chrome. The ESRI MCP server is externally hosted; the Angular app connects via
`StreamableHTTPClientTransport` and calls the `geocode_location` MCP tool for search.

## Technical Context

**Language/Version**: TypeScript 5.x / Angular 17+ (LTS, standalone components, strict mode)
**Primary Dependencies**: `@arcgis/core` 4.x (map rendering), `@modelcontextprotocol/sdk`
(MCP client), `bootstrap` 5.x + `ng-bootstrap` 16.x, Angular CLI 17+
**Storage**: No persistent storage; runtime config at `/assets/config.json` (gitignored)
for API key; browser in-memory only during session
**Testing**: Jasmine + Karma (unit/component), Playwright (e2e and MCP contract tests)
**Target Platform**: Modern browsers (Chrome 120+, Firefox 120+, Edge 120+, Safari 16+);
desktop and tablet (768px+)
**Project Type**: Single-page web application (Angular SPA, no backend)
**Performance Goals**: Map interactive < 5s (SC-001); geocode result visible < 3s (SC-002)
**Constraints**: WCAG 2.1 AA; API key never in source/bundle; no user authentication;
graceful degradation when ESRI MCP server unreachable
**Scale/Scope**: Single-user browser session; ESRI MCP server is externally hosted

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Angular Component Architecture | ✅ PASS | Feature module `features/map/`; standalone components; lazy-loadable routes; services for cross-component state; no cross-feature direct refs |
| II. Bootstrap-First UI | ✅ PASS | Bootstrap 5.x SCSS global; ng-bootstrap for Angular components; custom SCSS scoped to component files; ArcGIS widgets isolated in map container |
| III. ESRI MCP Integration | ✅ PASS | `EsriMcpService` wraps `@modelcontextprotocol/sdk` Client; all geo ops via `callTool()`; typed interfaces for all MCP params/results; no direct ArcGIS REST calls |
| IV. Test-First Development | ✅ PASS | Tests written before each implementation task; Jasmine unit tests for all services; Playwright contract tests against local MCP stub; red-green-refactor enforced |
| V. Observability & Accessibility | ✅ PASS | Structured JSON logs for every MCP call; Angular `ErrorHandler` for uncaught errors; WCAG 2.1 AA: `role="application"` on map, `aria-live` on error banner, keyboard nav |

**Gate result: PASS — all five principles satisfied. No complexity violations.**

*Post-Phase 1 re-check: ✅ All contracts and data model align with above. No new
violations introduced in design phase.*

## Project Structure

### Documentation (this feature)

```text
specs/001-angular-esri-mcp/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── mcp-tools.md     # MCP tool call contracts
│   └── ui-contracts.md  # Component @Input/@Output contracts
└── tasks.md             # Phase 2 output (/speckit-tasks — not yet created)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── core/
│   │   └── services/
│   │       ├── esri-mcp.service.ts      # MCP session lifecycle + callTool()
│   │       ├── map.service.ts           # ArcGIS MapView init/destroy
│   │       └── config.service.ts        # Runtime config loader (APP_INITIALIZER)
│   ├── features/
│   │   ├── map/
│   │   │   ├── components/
│   │   │   │   ├── map-canvas/
│   │   │   │   │   ├── map-canvas.component.ts
│   │   │   │   │   ├── map-canvas.component.html
│   │   │   │   │   └── map-canvas.component.scss
│   │   │   │   └── map-search/
│   │   │   │       ├── map-search.component.ts
│   │   │   │       ├── map-search.component.html
│   │   │   │       └── map-search.component.scss
│   │   │   └── map.routes.ts
│   │   └── shared/
│   │       ├── error-banner/
│   │       │   └── error-banner.component.ts
│   │       └── loading-spinner/
│   │           └── loading-spinner.component.ts
│   ├── app.component.ts
│   ├── app.component.html
│   ├── app.component.scss
│   └── app.routes.ts
├── assets/
│   └── config.json.template             # Committed; real config.json gitignored
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
└── styles.scss                          # Bootstrap SCSS + global theme vars

tests/
├── unit/                                # Jasmine specs (mirrors src/)
├── integration/                         # Playwright e2e tests
└── contract/                            # Local MCP stub + Playwright contract tests
```

**Structure Decision**: Single Angular SPA. No separate backend directory — ESRI MCP
server is externally hosted. Feature modules under `src/app/features/` per Principle I.
Core services (session, map, config) under `src/app/core/services/`.

## Complexity Tracking

> No constitution violations — complexity tracking not required.
