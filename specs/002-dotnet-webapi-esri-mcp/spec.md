# Feature Specification: .NET Web API — ESRI MCP Backend

**Feature Branch**: `002-dotnet-webapi-esri-mcp`  
**Created**: 2026-06-03  
**Status**: Draft  
**Input**: User description: "create webapi dotnet c# — move ESRI MCP to webapi"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Serve MCP Endpoint from Backend (Priority: P1)

An operator deploys the .NET Web API, which exposes a Model Context Protocol (MCP) endpoint. The Angular frontend application connects to this backend endpoint instead of attempting a direct browser-based MCP connection. The ArcGIS API key is stored exclusively on the server.

**Why this priority**: This is the foundational capability. Without a running MCP server, the Angular app falls back to direct geocoding with a client-exposed API key. Moving MCP to the backend is the primary goal of this feature.

**Independent Test**: Start the Web API locally → configure the Angular app's `mcpServerUrl` to point to the running API → Angular app reports an active MCP session.

**Acceptance Scenarios**:

1. **Given** the Web API is running, **When** the Angular frontend sends an MCP initialize request to `/mcp`, **Then** the API responds with a valid MCP capabilities handshake.
2. **Given** the Web API is running with a valid ArcGIS API key configured server-side, **When** the Angular frontend connects, **Then** no ArcGIS API key is present in any browser-visible config or response.
3. **Given** the Web API is stopped, **When** the Angular frontend tries to connect to `/mcp`, **Then** the Angular app falls back to the existing ArcGIS locator fallback gracefully.

---

### User Story 2 — Geocode Locations via MCP Tool (Priority: P2)

A user types a location query in the Angular search bar. The Angular frontend sends an MCP `geocode_location` tool call to the backend API. The API calls the ESRI ArcGIS geocoding service using its server-side API key and returns the geocoded result to the frontend. The map centers on the result.

**Why this priority**: This is the primary end-user interaction — without geocoding working through the MCP server, the feature delivers no user-visible value beyond story 1.

**Independent Test**: With the API running and Angular connected, enter "Seattle, WA" in the search box → map centers on Seattle → browser network tab shows the geocoding request going to the backend, not directly to arcgis.com.

**Acceptance Scenarios**:

1. **Given** the MCP session is active, **When** the user searches "Seattle, WA", **Then** the map centers on Seattle within 3 seconds.
2. **Given** a valid query is submitted, **When** the API calls the ESRI geocoding service, **Then** the result includes display name, latitude, longitude, and score.
3. **Given** a query returns no results, **When** the tool call completes, **Then** the API returns an MCP error response and the Angular app shows a user-friendly message.
4. **Given** the ArcGIS service is unreachable, **When** a geocode request arrives, **Then** the API returns a structured error and the Angular app displays it.

---

### User Story 3 — Secure Server-Side API Key Configuration (Priority: P3)

An operator configures the ArcGIS API key via an environment variable or server-side config file. The key is never transmitted to or stored on the client. The Web API validates that the key is present at startup and refuses to start (or returns a clear error) if missing.

**Why this priority**: Security correctness. The ArcGIS API key in the current Angular app is stored in a gitignored `public/config.json` which is still served to the browser. Moving it server-side eliminates that exposure entirely.

**Independent Test**: Start the API with no API key configured → API starts but returns a 503 with a descriptive error on geocoding requests → configure a valid key → geocoding succeeds without the client ever receiving the key value.

**Acceptance Scenarios**:

1. **Given** `ESRI_API_KEY` is not set, **When** a geocoding MCP tool call arrives, **Then** the API returns a structured error indicating misconfiguration; the key value is never in any response.
2. **Given** `ESRI_API_KEY` is set to a valid key, **When** the API processes a geocoding request, **Then** the key is used internally and never appears in any response body, log line visible to clients, or HTTP header.
3. **Given** CORS is configured with an allowed origin list, **When** a request arrives from an unlisted origin, **Then** the API rejects it with a 403 before any MCP processing occurs.

---

### Edge Cases

- What happens when the ArcGIS geocoding service returns a timeout? API must propagate a timeout error as an MCP error response within a configurable deadline.
- What happens when the MCP client sends a malformed tool call payload? API must return an MCP protocol-compliant error, not an unhandled exception.
- What happens when multiple Angular clients connect simultaneously? API must handle concurrent MCP sessions independently.
- What happens when the API key is rotated while the server is running? A server restart is acceptable; hot-reload is out of scope.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The backend MUST expose an HTTP endpoint compatible with the MCP Streamable HTTP transport protocol.
- **FR-002**: The backend MUST implement the `geocode_location` MCP tool, accepting a `query` string and returning display name, latitude, longitude, score, and optional extent.
- **FR-003**: The backend MUST read the ArcGIS API key exclusively from server-side configuration (environment variable or config file); the key MUST NOT appear in any HTTP response.
- **FR-004**: The backend MUST call the ESRI ArcGIS World Geocoder REST API on behalf of the client using the server-side API key.
- **FR-005**: The backend MUST support configurable CORS origins so only the Angular frontend's origin is permitted by default.
- **FR-006**: The backend MUST return MCP-protocol-compliant error responses for all failure cases (missing key, geocoding failure, invalid input).
- **FR-007**: The backend MUST log each geocoding tool invocation with timestamp, query, response status, and duration (no API key values in logs).
- **FR-008**: The backend MUST start up and be ready to serve within 10 seconds on standard developer hardware.
- **FR-009**: The Angular frontend's `mcpServerUrl` configuration MUST be updated to point to the new backend endpoint, and the fallback logic MUST remain in place for when the backend is unreachable.

### Key Entities

- **McpSession**: Represents an active MCP client connection — tracks session ID and lifecycle.
- **GeocodeRequest**: Input to the `geocode_location` tool — contains `query` string.
- **GeocodeResponse**: Output from the tool — display name, latitude, longitude, score, optional bounding extent.
- **AppConfiguration**: Server-side config — ArcGIS API key, allowed CORS origins, geocoder URL, request timeout.
- **ToolInvocationLog**: Audit record for each MCP tool call — timestamp, tool name, params (sanitized), response status, duration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Geocoding requests from the Angular app complete end-to-end (browser → backend → ESRI → backend → browser) within 3 seconds under normal network conditions.
- **SC-002**: The ArcGIS API key is absent from all browser-observable data: no config JSON served to the client, no response headers, no MCP response payloads.
- **SC-003**: The backend handles at least 10 concurrent MCP sessions without errors.
- **SC-004**: Starting the backend with a missing API key produces a clear, actionable error message for the operator within 5 seconds of startup.
- **SC-005**: 100% of geocoding tool invocations produce a structured log entry (success or error).

## Assumptions

- The ArcGIS World Geocoder REST API endpoint and authentication mechanism remain unchanged from what the Angular app currently uses.
- The Angular frontend will be updated to point its `mcpServerUrl` at the new backend; no changes to the Angular MCP client code are required beyond configuration.
- The .NET backend runs on the same machine as the developer during local development (CORS default origin: `http://localhost:4200`).
- Hot-reload of API keys without a server restart is out of scope for this feature.
- Authentication between the Angular frontend and the .NET backend (e.g., JWT) is out of scope; the backend relies on CORS and network-level access control.
- The existing ArcGIS locator fallback in the Angular app remains in place and is not removed by this feature.
