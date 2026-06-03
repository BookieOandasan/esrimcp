---
description: "Task list for Angular Web App with ESRI MCP Connection"
---

# Tasks: Angular Web App with ESRI MCP Connection

**Input**: Design documents from `/specs/001-angular-esri-mcp/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: TDD is NON-NEGOTIABLE per Constitution Principle IV. Test tasks are included
and MUST be written before their corresponding implementation tasks (Red-Green-Refactor).

**Organization**: Tasks are grouped by user story to enable independent implementation
and testing.

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize the Angular project and install all dependencies.

- [x] T001 Create Angular 17+ project: `ng new esrimcp --standalone --strict --routing --style=scss` at repo root
- [x] T002 Install npm dependencies: `npm install @arcgis/core @modelcontextprotocol/sdk bootstrap ng-bootstrap`
- [x] T003 [P] Install dev dependencies: `npm install -D playwright @playwright/test @types/jasmine`
- [x] T004 [P] Configure tsconfig.json: set `allowSyntheticDefaultImports: true`, `resolveJsonModule: true` in src/tsconfig.json
- [x] T005 [P] Create public/config.json.template with `esriApiKey` and `mcpServerUrl` placeholder fields (Angular 21: assets in public/)
- [x] T006 Create/verify .gitignore: ensure `public/config.json` and `node_modules/` are excluded

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, shared infrastructure, and config loading that ALL user stories
depend on. No user story work can begin until this phase is complete.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T007 Create TypeScript type definitions in src/app/core/models/app.types.ts (MapStatus, SessionStatus, OperationStatus, McpToolName, MapExtent, GeocodeResult)
- [x] T008 [P] Create AppConfig interface in src/app/core/models/config.model.ts (esriApiKey, mcpServerUrl, mapDefaultCenter, mapDefaultZoom)
- [x] T009 Write unit tests for ConfigService in src/app/core/services/config.service.spec.ts (test: loads config, rejects if esriApiKey missing, rejects if mcpServerUrl missing)
- [x] T010 Implement ConfigService with APP_INITIALIZER in src/app/core/services/config.service.ts (fetch /config.json, validate required fields, expose typed config signal)
- [x] T011 [P] Write unit tests for ErrorBannerComponent in src/app/features/shared/error-banner/error-banner.component.spec.ts
- [x] T012 Implement ErrorBannerComponent (standalone) in src/app/features/shared/error-banner/error-banner.component.ts
- [x] T013 [P] Write unit tests for LoadingSpinnerComponent in src/app/features/shared/loading-spinner/loading-spinner.component.spec.ts
- [x] T014 Implement LoadingSpinnerComponent (standalone) in src/app/features/shared/loading-spinner/loading-spinner.component.ts
- [x] T015 [P] Import Bootstrap SCSS in src/styles.scss and configure Bootstrap theme variables (primary color, font stack)
- [x] T016 [P] Configure ESLint with Angular schematic: `ng add @angular-eslint/schematics`

**Checkpoint**: Foundation ready — all shared infrastructure complete, user stories can begin.

---

## Phase 3: User Story 1 — View ESRI-Powered Map Interface (Priority: P1) 🎯 MVP

**Goal**: User opens the app and sees a full-screen interactive ESRI map with zoom/pan
controls. Graceful error shown if ESRI service is unavailable.

**Independent Test**: Open the app in a browser → map canvas renders with tile layers and
controls → pan/zoom works → all without any search interaction.

### Tests for User Story 1 (TDD — write FIRST, ensure they FAIL)

- [x] T017 Write unit tests for MapService in src/app/core/services/map.service.spec.ts
- [x] T018 [P] Write unit tests for MapCanvasComponent in src/app/features/map/components/map-canvas/map-canvas.component.spec.ts
- [ ] T019 [P] Write Playwright integration test for US1 in tests/integration/map-display.spec.ts

### Implementation for User Story 1

- [x] T020 Implement MapService in src/app/core/services/map.service.ts
- [x] T021 Implement MapCanvasComponent in src/app/features/map/components/map-canvas/map-canvas.component.ts
- [x] T022 [P] Create map feature routes in src/app/features/map/map.routes.ts (updated to load MapComponent)
- [x] T023 Update app.routes.ts to lazy-load map feature
- [x] T024 Update AppComponent (app.ts + app.html): Bootstrap layout, router-outlet, config error banner

**Checkpoint**: US1 fully functional — map loads, pans, zooms, shows error banner on failure.

---

## Phase 4: User Story 2 — ESRI MCP Tool Invocation from UI (Priority: P2)

**Goal**: User types a place name in a search bar and the map centers on the geocoded
result with a marker. Loading indicator shown during search. Error shown on MCP failure.

**Independent Test**: Enter "Seattle, WA" in the search bar → map centers on Seattle →
marker placed → structured MCP log visible in DevTools console.

### Tests for User Story 2 (TDD — write FIRST, ensure they FAIL)

- [x] T025 Write unit tests for EsriMcpService in src/app/core/services/esri-mcp.service.spec.ts
- [x] T026 [P] Create MCP contract stub in tests/contract/geocode-location-stub.ts
- [x] T028 [P] Write unit tests for MapSearchComponent in src/app/features/map/components/map-search/map-search.component.spec.ts
- [ ] T030 [P] Write Playwright integration test for US2 in tests/integration/geocoding.spec.ts

### Implementation for User Story 2

- [x] T027 Implement EsriMcpService in src/app/core/services/esri-mcp.service.ts
- [x] T029 Implement MapSearchComponent in src/app/features/map/components/map-search/map-search.component.ts
- [x] T031 MapService.centerOn() already implemented in T020
- [x] T032 Wire search in src/app/features/map/map.component.ts (MapComponent combines canvas + search + MCP invocation)

**Checkpoint**: US2 fully functional — search geocodes via ESRI MCP, map centers on result.

---

## Phase 5: User Story 3 — Secure API Key Configuration (Priority: P3)

**Goal**: Operator sets ESRI_API_KEY environment variable; app reads from runtime config;
missing or invalid key shows a clear startup error with no map attempted.

**Independent Test**: Run app with no config.json → config error displayed on startup →
map does not attempt to render. Then add valid config → map loads.

### Tests for User Story 3 (TDD — write FIRST, ensure they FAIL)

- [x] T033 Config error tests already in src/app/core/services/config.service.spec.ts (T009)
- [ ] T034 [P] Write Playwright integration test for missing config in tests/integration/config-error.spec.ts

### Implementation for User Story 3

- [x] T035 ConfigService already sets configError signal on missing/empty fields (implemented in T010)
- [x] T036 Create Angular global ErrorHandler in src/app/core/handlers/global-error-handler.ts
- [x] T037 AppComponent (app.ts + app.html) guards map behind configError check
- [x] T038 [P] .gitignore excludes public/config.json — verified

**Checkpoint**: US3 fully functional — all three stories independently verifiable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: WCAG 2.1 AA compliance, Bootstrap theming, final build validation.

- [x] T039 [P] WCAG role=application + aria-label="Interactive map" in map-canvas.component.ts (inline template)
- [x] T040 [P] WCAG aria-label on search input + button + aria-busy on form in map-search.component.ts
- [x] T041 [P] role=alert + aria-live=assertive in error-banner.component.ts
- [x] T042 [P] role=status + aria-label bound to label in loading-spinner.component.ts
- [x] T043 26/26 unit tests pass (ng test --watch=false, Vitest)
- [ ] T044 Playwright integration tests deferred — require live ESRI MCP server + API key
- [x] T045 Production build succeeds; initial bundle 462 kB / 88 kB gzipped (within 1 MB budget)
- [ ] T046 Quickstart validation deferred — requires live ESRI API key in public/config.json

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational (Phase 2) — no US2/US3 dependency
- **US2 (Phase 4)**: Depends on Foundational + US1 MapService (T020) for centerOn extension
- **US3 (Phase 5)**: Depends on Foundational (ConfigService from T010) — largely independent
- **Polish (Phase 6)**: Depends on all user story phases complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 complete — provides the base map
- **US2 (P2)**: Requires T020 (MapService) from US1 to extend with centerOn(); otherwise independent
- **US3 (P3)**: Requires T010 (ConfigService) from Phase 2; independent of US1/US2

### Within Each User Story

1. Tests (spec files) MUST be written and MUST FAIL before implementation begins
2. Types/interfaces before services (T007/T008 before T010)
3. Services before components that depend on them
4. Components before AppComponent wiring
5. Each story must pass its Independent Test before moving to the next

### Parallel Opportunities

- T003, T004, T005 can run in parallel with T001/T002 after project init
- T011+T013 (shared component tests) can run in parallel
- T012+T014 (shared component impls) can run in parallel
- T017+T018+T019 (US1 tests) can run in parallel
- T025+T026+T028+T030 (US2 tests) can run in parallel
- T039+T040+T041+T042 (accessibility audit tasks) can run in parallel

---

## Parallel Example: User Story 2 Tests

```bash
# Launch all test authoring tasks for US2 together:
Task T025: "Write EsriMcpService unit tests in src/app/core/services/esri-mcp.service.spec.ts"
Task T026: "Create MCP contract stub in tests/contract/geocode-location-stub.ts"
Task T028: "Write MapSearchComponent unit tests in .../map-search.component.spec.ts"
Task T030: "Write Playwright geocoding integration test in tests/integration/geocoding.spec.ts"

# Then launch implementation tasks:
Task T027: "Implement EsriMcpService" (after T025 fails)
Task T029: "Implement MapSearchComponent" (after T028 fails)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (map display)
4. **STOP and VALIDATE**: Open browser → map renders → pans/zooms → error state shows banner
5. Deploy/demo the working map as MVP

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ready
2. Phase 3: Map renders → independent US1 test passes → Demo 1
3. Phase 4: Geocoding works → independent US2 test passes → Demo 2
4. Phase 5: Config security validated → independent US3 test passes → Demo 3
5. Phase 6: Polish → production build clean → final release

---

## Notes

- `[P]` = different files, no dependency on incomplete tasks — safe to run in parallel
- `[US1/US2/US3]` label maps each task to its user story for traceability
- TDD is non-negotiable (Constitution IV): every spec file MUST exist and fail before implementation
- Never commit `src/assets/config.json` — contains the ArcGIS API key
- Structured MCP logging required for every `callTool()` invocation (Constitution V)
- WCAG 2.1 AA verification is a hard gate before production build
