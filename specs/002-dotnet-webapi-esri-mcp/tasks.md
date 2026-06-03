---
description: "Task list for .NET Web API — ESRI MCP Backend"
---

# Tasks: .NET Web API — ESRI MCP Backend

**Input**: Design documents from `/specs/002-dotnet-webapi-esri-mcp/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: TDD is NON-NEGOTIABLE per Constitution Principle IV. Test tasks are included
and MUST be written before their corresponding implementation tasks (Red-Green-Refactor).

**Organization**: Tasks are grouped by user story to enable independent implementation
and testing.

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create the .NET 9 solution and install all dependencies.

- [x] T001 Create .NET 9 solution: `dotnet new sln -n EsriMcp -o server` then `dotnet new webapi -n EsriMcp.Api -o server/EsriMcp.Api --no-openapi` and `dotnet new xunit -n EsriMcp.Api.Tests -o server/EsriMcp.Api.Tests`; add both projects to `server/EsriMcp.sln`
- [x] T002 Add NuGet packages to server/EsriMcp.Api/EsriMcp.Api.csproj: `dotnet add package ModelContextProtocol.AspNetCore`
- [x] T003 [P] Add NuGet packages to server/EsriMcp.Api.Tests/EsriMcp.Api.Tests.csproj: `dotnet add package Moq` and `dotnet add package Microsoft.AspNetCore.Mvc.Testing`; add project reference to EsriMcp.Api
- [x] T004 [P] Create server/.gitignore excluding `bin/`, `obj/`, `*.user`, `appsettings.*.local.json`, `.vs/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, configuration binding, and DI skeleton that all user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T005 Create all four model files in server/EsriMcp.Api/Models/: `AppConfiguration.cs` (ApiKey, GeocoderUrl, TimeoutSeconds, AllowedOrigins[]), `GeocodeRequest.cs` (Query string), `GeocodeResult.cs` (DisplayName, Longitude, Latitude, Score, Extent?), `MapExtent.cs` (Xmin, Ymin, Xmax, Ymax, WkId)
- [x] T006 [P] Create `IGeocodingService` interface in server/EsriMcp.Api/Services/IGeocodingService.cs with method `Task<GeocodeResult> GeocodeAsync(string query, CancellationToken ct)`
- [x] T007 Create `server/EsriMcp.Api/appsettings.json` with placeholder config: `Esri.ApiKey=""`, `Esri.GeocoderUrl="https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates"`, `Esri.TimeoutSeconds=10`, `AllowedOrigins=["http://localhost:4200"]`
- [x] T008 Create `server/EsriMcp.Api/Program.cs` shell: bind `IOptions<AppConfiguration>` from config section `"Esri"` + `AllowedOrigins`; add CORS policy reading `AllowedOrigins`; call `builder.Services.AddMcpServer().WithHttpTransport().WithToolsFromAssembly()`; `app.UseCors(); app.MapMcp("/mcp")`

**Checkpoint**: Foundation ready — all shared infrastructure complete, user stories can begin.

---

## Phase 3: User Story 1 — Serve MCP Endpoint from Backend (Priority: P1) 🎯 MVP

**Goal**: The .NET API exposes `/mcp`; the Angular frontend successfully completes an MCP initialize handshake and reports an active MCP session.

**Independent Test**: Start `dotnet run` in `server/EsriMcp.Api` → send MCP `initialize` request to `http://localhost:5000/mcp` → response includes `capabilities` with `geocode_location` listed in tools.

### Tests for User Story 1 (TDD — write FIRST, ensure they FAIL)

- [x] T009 [P] [US1] Write unit tests for GeocodeTool in server/EsriMcp.Api.Tests/Tools/GeocodeToolTests.cs: mock `IGeocodingService`; test cases: (a) valid query delegates to service and returns result, (b) empty query throws `ArgumentException` before calling service, (c) service exception propagates as MCP error
- [x] T010 [P] [US1] Write integration test for MCP initialize handshake in server/EsriMcp.Api.Tests/Integration/McpEndpointTests.cs using `WebApplicationFactory<Program>`: POST to `/mcp` with `{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","clientInfo":{"name":"test","version":"1.0"}},"id":0}` and assert response contains `"geocode_location"` in capabilities

### Implementation for User Story 1

- [x] T011 [US1] Implement `GeocodeTool` in server/EsriMcp.Api/Tools/GeocodeTool.cs: class decorated with `[McpServerToolType]`; method `GeocodeLocation` decorated with `[McpServerTool]` and `[Description("Geocode a place name or address to coordinates")]`; inject `IGeocodingService` via parameter; validate query non-empty (throw `ArgumentException`); call `geocodingService.GeocodeAsync(query, ct)`; return result
- [x] T012 [US1] Complete server/EsriMcp.Api/Program.cs DI wiring: ensure `AddMcpServer`, `WithHttpTransport`, `WithToolsFromAssembly` are correctly chained; verify `app.MapMcp("/mcp")` maps the route; run `dotnet build` and confirm zero errors

**Checkpoint**: US1 fully functional — MCP session initializes, `geocode_location` appears in capabilities. Start server and verify with curl.

---

## Phase 4: User Story 2 — Geocode Locations via MCP Tool (Priority: P2)

**Goal**: User searches a location in Angular; the frontend sends a `geocode_location` tool call to the .NET backend; backend calls ArcGIS REST API with the server-side key and returns coordinates; map centers on result.

**Independent Test**: With `dotnet run` running and `ESRI__ApiKey` set, POST a `tools/call` for `geocode_location` with `{"query":"Seattle, WA"}` to `/mcp` → response contains longitude, latitude, and score; network traffic shows request going to `localhost:5000` not to `arcgis.com` from the browser.

### Tests for User Story 2 (TDD — write FIRST, ensure they FAIL)

- [x] T013 [P] [US2] Write unit tests for `ArcGisGeocodingService` in server/EsriMcp.Api.Tests/Services/ArcGisGeocodingServiceTests.cs using mocked `HttpMessageHandler`: (a) valid response with one candidate returns correct `GeocodeResult` with longitude/latitude/score/extent, (b) empty candidates array throws with "No results found", (c) candidate with null location throws with "no coordinates", (d) HTTP timeout throws wrapped exception, (e) non-2xx HTTP response throws
- [x] T014 [P] [US2] Extend server/EsriMcp.Api.Tests/Integration/McpEndpointTests.cs with a `geocode_location` tool call test: mock `IGeocodingService` in test host; send `tools/call` request; assert response contains `displayName`, `longitude`, `latitude`, `score`

### Implementation for User Story 2

- [x] T015 [US2] Implement `ArcGisGeocodingService` in server/EsriMcp.Api/Services/ArcGisGeocodingService.cs: inject `IHttpClientFactory` (named client `"arcgis"`) and `IOptions<AppConfiguration>`; build query string `SingleLine={query}&f=json&token={apiKey}&maxLocations=1&outFields=*`; GET geocoder URL; parse `candidates[0]` into `GeocodeResult`; handle all error cases from contract (0 candidates, null location, timeout, HTTP error)
- [x] T016 [US2] Register services in server/EsriMcp.Api/Program.cs: `services.AddHttpClient("arcgis", c => { c.BaseAddress = new Uri(config.GeocoderUrl); c.Timeout = TimeSpan.FromSeconds(config.TimeoutSeconds); })`; `services.AddScoped<IGeocodingService, ArcGisGeocodingService>()`
- [x] T017 [US2] Update `public/config.json` (gitignored Angular config) to set `"mcpServerUrl": "http://localhost:5000/mcp"` — ensures Angular MCP client connects to .NET backend; update `public/config.json.template` placeholder comment

**Checkpoint**: US2 fully functional — search geocodes via .NET backend MCP; map centers on result; no ArcGIS calls visible in browser network tab.

---

## Phase 5: User Story 3 — Secure Server-Side API Key Configuration (Priority: P3)

**Goal**: API key lives only in server config; missing key produces a clear operator error; key never appears in any response, log, or header.

**Independent Test**: Start server with `ESRI__ApiKey` unset → geocoding tool calls return MCP error "Geocoding service is not configured" → Angular displays error banner → key never present in any response body or log line.

### Tests for User Story 3 (TDD — write FIRST, ensure they FAIL)

- [x] T018 [P] [US3] Write test in server/EsriMcp.Api.Tests/Services/ArcGisGeocodingServiceTests.cs for missing/empty `ApiKey`: when config has `ApiKey = ""`, `GeocodeAsync` throws `InvalidOperationException` with message "Geocoding service is not configured"
- [x] T019 [P] [US3] Write integration test in server/EsriMcp.Api.Tests/Integration/McpEndpointTests.cs verifying API key security: serialize full JSON-RPC response to string; assert response does not contain the test API key value used in the test host configuration

### Implementation for User Story 3

- [x] T020 [US3] Add ApiKey guard in `ArcGisGeocodingService.GeocodeAsync` in server/EsriMcp.Api/Services/ArcGisGeocodingService.cs: if `string.IsNullOrWhiteSpace(_config.ApiKey)` throw `InvalidOperationException("Geocoding service is not configured")`; this is caught by GeocodeTool and returned as MCP error
- [x] T021 [US3] Add structured `ToolInvocationLog` logging to server/EsriMcp.Api/Tools/GeocodeTool.cs: inject `ILogger<GeocodeTool>`; record `{Timestamp, ToolName, Query, ResponseStatus, DurationMs, ErrorMessage}` using `Stopwatch`; log AFTER the service call (success or failure); ensure `_config.ApiKey` is never referenced in any log statement
- [x] T022 [US3] Update server/EsriMcp.Api/appsettings.json comment header (XML comment block) documenting that `Esri.ApiKey` must be set via `ESRI__ApiKey` environment variable and never committed; update `public/config.json.template` to note that `mcpServerUrl` now points to the .NET backend

**Checkpoint**: US3 fully functional — all three stories independently verifiable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate all stories, confirm test suite passes, quickstart scenarios work.

- [x] T023 [P] Run full test suite in server/: `dotnet test --logger "console;verbosity=normal"` — all tests must pass; fix any failures before proceeding
- [x] T024 [P] Verify production build: `dotnet publish server/EsriMcp.Api -c Release -o server/_publish` succeeds with no errors or warnings
- [x] T025 Run quickstart.md Scenario A (happy path), Scenario B (missing key), Scenario C (no results), and Scenario D (backend offline) manually; confirm all four scenarios behave as documented

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational (Phase 2) — no US2/US3 dependency
- **US2 (Phase 4)**: Depends on Foundational (Phase 2) + US1 GeocodeTool (T011) — service and tool must exist before ArcGIS impl is wired
- **US3 (Phase 5)**: Depends on Foundational (Phase 2) — largely independent of US1/US2 beyond existing `ArcGisGeocodingService`
- **Polish (Phase 6)**: Depends on all user story phases complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — provides the MCP server skeleton
- **US2 (P2)**: Requires GeocodeTool (T011) from US1; `ArcGisGeocodingService` is US2's core deliverable
- **US3 (P3)**: Requires `ArcGisGeocodingService` (T015) from US2 to add the ApiKey guard and logging

### Within Each User Story

1. Tests (spec files) MUST be written and MUST FAIL before implementation begins
2. Models/interfaces before services (T005/T006 before T015)
3. Services before tool handlers that depend on them
4. Tool registration before integration tests verify the full pipeline
5. Each story must pass its Independent Test before moving to the next

### Parallel Opportunities

- T002, T003, T004 can run in parallel after T001 completes
- T006, T007 can run in parallel with T005 after Phase 2 starts
- T009, T010 (US1 tests) can run in parallel
- T013, T014 (US2 tests) can run in parallel
- T018, T019 (US3 tests) can run in parallel
- T023, T024 (Polish validation) can run in parallel

---

## Parallel Example: User Story 2 Tests

```text
# Launch all test authoring tasks for US2 together:
Task T013: "Write ArcGisGeocodingServiceTests with mocked HttpMessageHandler"
Task T014: "Extend McpEndpointTests with geocode_location tool call test"

# Then launch implementation tasks:
Task T015: "Implement ArcGisGeocodingService" (after T013 fails as expected)
Task T016: "Register services in Program.cs" (after T015 exists)
Task T017: "Update Angular public/config.json mcpServerUrl" (independent — can run any time)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (MCP server skeleton + initialize handshake)
4. **STOP and VALIDATE**: `dotnet run` → Angular connects → DevTools shows "MCP session active"
5. Demo the working MCP connection as MVP

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ready
2. Phase 3: MCP endpoint serves → US1 independent test passes → Demo 1 (MCP connection)
3. Phase 4: Geocoding works through backend → US2 independent test passes → Demo 2 (no ArcGIS calls in browser)
4. Phase 5: API key hardened → US3 independent test passes → Demo 3 (security verified)
5. Phase 6: Polish → all tests pass → publish succeeds → final release

---

## Notes

- `[P]` = different files, no dependency on incomplete tasks — safe to run in parallel
- `[US1/US2/US3]` label maps each task to its user story for traceability
- TDD is non-negotiable (Constitution IV): every spec file MUST exist and fail before implementation
- Never commit a real `ESRI__ApiKey` value — store only in environment, never in `appsettings.json`
- Structured MCP logging required for every tool invocation (Constitution V)
- The Angular frontend requires NO code changes — only `public/config.json` mcpServerUrl update
