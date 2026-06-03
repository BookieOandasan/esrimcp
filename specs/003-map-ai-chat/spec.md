# Feature Specification: AI Chat Component with ESRI MCP

**Feature Branch**: `003-map-ai-chat`  
**Created**: 2026-06-03  
**Status**: Draft  
**Input**: User description: "add a aichat component using ESRI MCP"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Ask a Geospatial Question via Chat (Priority: P1)

A user opens the AI chat panel inside the map application and types a natural language question such as "Where is the Eiffel Tower?" or "Take me to Tokyo". The system interprets the message, invokes the appropriate ESRI MCP tool (e.g., `geocode_location`), and responds in the chat with a confirmation message while simultaneously centering the map on the found location.

**Why this priority**: This is the core value proposition — natural language interaction with the map, removing the need for exact place-name syntax. Without this working, the chat component delivers no user value.

**Independent Test**: Open the chat panel → type "Show me Sydney, Australia" → chat displays a response like "Found: Sydney, New South Wales, Australia" → map centers on Sydney — all without touching the search bar.

**Acceptance Scenarios**:

1. **Given** the chat panel is open, **When** the user types "Where is the Eiffel Tower?" and submits, **Then** the chat shows a bot reply with the location name and the map centers on Paris, France within 3 seconds.
2. **Given** a place query is submitted, **When** the MCP tool returns a result, **Then** the chat history shows both the user's message and the bot's reply in chronological order.
3. **Given** the user submits a query, **When** the response is loading, **Then** a typing indicator appears in the chat and the input is disabled until the response arrives.
4. **Given** the chat has multiple exchanges, **When** the user scrolls up, **Then** the full conversation history is visible and the most recent message is at the bottom.

---

### User Story 2 — Receive Informative Error Feedback (Priority: P2)

When the user asks about an unrecognisable place or the MCP service is unavailable, the chat component displays a clear, friendly error message in the conversation rather than silently failing or showing a raw error code.

**Why this priority**: Error feedback directly in the chat is essential for usability — without it, users are left confused when a query fails.

**Independent Test**: Type a nonsense query like "xyzzy12345nonexistent" → chat shows "Sorry, I couldn't find that location. Please try a different place name." → map does not move → conversation history preserved.

**Acceptance Scenarios**:

1. **Given** the user submits an unrecognisable location, **When** the geocoding service finds no results, **Then** the chat displays a friendly error message and the map remains unchanged.
2. **Given** the MCP backend is unreachable, **When** the user submits a query, **Then** the chat displays "The map service is temporarily unavailable. Please try again shortly." without exposing technical details.
3. **Given** the user submits an empty message, **When** they press send, **Then** the message is not sent and the input shows a validation hint.

---

### User Story 3 — Manage the Chat Panel Visibility (Priority: P3)

A user can open and close the AI chat panel without losing their conversation history, and can clear the chat history to start fresh.

**Why this priority**: Panel management is expected UX hygiene — without it the chat cannot be dismissed, blocking part of the map. Chat history persistence during hide/show improves the conversational experience.

**Independent Test**: Open chat → send two messages → close chat → reopen chat → both messages still visible → click "Clear chat" → conversation resets to the welcome message only.

**Acceptance Scenarios**:

1. **Given** the chat panel is open, **When** the user clicks the close button, **Then** the panel collapses and the map occupies the full viewport.
2. **Given** the chat panel was closed with messages in it, **When** the user reopens it, **Then** the previous conversation is still visible.
3. **Given** the chat has a history, **When** the user clicks "Clear chat", **Then** the conversation resets to only the welcome message.

---

### Edge Cases

- What happens when the user submits a very long message (>500 characters)? Input is truncated or rejected with a hint before sending.
- What happens when the user sends the same query twice rapidly? The second submission is ignored while the first is in-flight (debounce).
- What happens when the map service returns multiple equally-scored results? The chat uses the highest-scored result and notes the choice.
- What happens if the chat panel and the search bar are used simultaneously? Both operate independently; no state conflict.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST include a chat panel accessible from the map view via a visible toggle button.
- **FR-002**: Users MUST be able to type and submit natural language location queries in the chat input field.
- **FR-003**: The system MUST interpret submitted messages as location queries and invoke the appropriate ESRI MCP geocoding tool.
- **FR-004**: Successful geocoding responses MUST appear as bot messages in the chat AND simultaneously pan and zoom the map to the found location.
- **FR-005**: The chat MUST display a loading/typing indicator while a query is in progress, and the input MUST be disabled during this period.
- **FR-006**: Failed queries MUST display a user-friendly error message in the chat; technical error details MUST NOT be shown to the user.
- **FR-007**: The chat MUST maintain a scrollable conversation history for the duration of the session.
- **FR-008**: Users MUST be able to close and reopen the chat panel without losing the current session's conversation history.
- **FR-009**: Users MUST be able to clear the conversation history via an explicit "Clear chat" action.
- **FR-010**: The chat panel MUST be accessible: all interactive elements require visible focus indicators and keyboard navigation support; the conversation region MUST announce new messages to screen readers.

### Key Entities

- **ChatMessage**: A single entry in the conversation — sender (user or bot), text content, timestamp, and status (pending, success, error).
- **ChatSession**: The ordered list of `ChatMessage` entries for the current session, plus panel open/closed state.
- **LocationQueryResult**: The structured output of a successful geocoding MCP tool call — display name, coordinates, and bounding extent — used to update both the chat reply and the map view.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can submit a location query and see the map move to the result within 3 seconds under normal network conditions.
- **SC-002**: 95% of submitted location queries that return a valid geocoding result correctly update both the chat and the map.
- **SC-003**: Error messages are displayed for 100% of failed queries; no query failure produces a blank or stuck UI state.
- **SC-004**: The chat panel opens, closes, and restores history in under 300 ms with no visible layout shift on the map.
- **SC-005**: All chat interactions are operable by keyboard alone; screen reader users receive announcements for new messages.

## Assumptions

- The ESRI MCP backend (`003-map-ai-chat` builds on `002-dotnet-webapi-esri-mcp`) is running and reachable; the Angular app's existing MCP session and fallback logic are reused.
- The chat component does not connect to a large language model — it uses the ESRI MCP `geocode_location` tool directly to respond to location-style queries. Free-form non-location questions (e.g. "What is the capital of France?") are answered with "I can help you find locations — try asking me to show you a place on the map."
- Conversation history is session-only (in-memory); no server-side persistence is required.
- The chat panel is a side panel or overlay within the existing Angular map view, not a separate route.
- Mobile responsiveness is out of scope for this iteration; the component is designed for desktop viewports.
- The existing search bar remains on the page alongside the chat; both are independent entry points for geocoding.
