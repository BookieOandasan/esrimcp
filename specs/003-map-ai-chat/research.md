# Research: AI Chat Component with ESRI MCP

**Feature**: 003-map-ai-chat  
**Date**: 2026-06-03  
**Status**: Complete — all decisions resolved

---

## Decision 1: Chat Panel Layout — Bootstrap Offcanvas

**Decision**: Use Bootstrap 5 `Offcanvas` (end/right placement) for the chat panel, toggled by a button in the existing map toolbar.

**Rationale**:
- Offcanvas is purpose-built for exactly this pattern: a dismissable side panel that slides over content without displacing the map
- Already on the page via Bootstrap SCSS import — zero extra dependency
- Built-in keyboard trap, `aria-modal`, focus management, and backdrop — WCAG compliance for free
- `ngbOffcanvas` from `@ng-bootstrap/ng-bootstrap` (already in `package.json`) provides an Angular-idiomatic API: `offcanvasService.open(ChatComponent)` returns a reference that carries the session

**Alternatives considered**:
- Custom CSS side panel: More control but requires manual accessibility, focus trap, and dismiss-on-Escape implementation — not worth re-inventing when Bootstrap provides it
- Angular Material `MatSidenav`: Not in the project; adding a second UI framework violates Constitution Principle II (Bootstrap-first)

---

## Decision 2: State Management — Angular Signals in ChatService

**Decision**: Manage `ChatMessage[]` history and panel state using Angular Signals (`signal()`, `computed()`) inside `ChatService` (provided in root).

**Rationale**:
- Consistent with the existing codebase (all services use signals: `MapService.mapStatus()`, `EsriMcpService.sessionStatus()`, `ConfigService.configError()`)
- Singleton service ensures chat history survives Offcanvas open/close cycles (Offcanvas re-creates the component; the service retains state)
- No NgRx boilerplate needed for a feature this size

**Alternatives considered**:
- Component-local state: Chat history would be lost every time the panel is closed — violates US3 acceptance scenario 2
- NgRx: Significant overhead for what is essentially a list of messages and a boolean flag

---

## Decision 3: Query Processing — MCP-first with GeocodingService Fallback

**Decision**: `ChatService.processMessage()` reuses the existing `EsriMcpService` + `GeocodingService` pattern from `MapComponent.onSearch()`.

**Rationale**:
- No new geocoding code; the two services are already wired and tested
- MCP session is managed by `MapComponent.ngOnInit()` — the chat panel shares the same singleton `EsriMcpService` instance
- For non-location queries, `ChatService` returns a canned redirect string without calling either service: "I can help you find locations on the map — try asking me to show you a place!"

**Processing flow**:
```
ChatService.processMessage(text)
  → if EsriMcpService.sessionStatus() === 'active'
       → EsriMcpService.callTool('geocode_location', { query: text })
    else
       → GeocodingService.geocode(text)
  → on success: MapService.centerOn(result) + add bot success message
  → on error: add bot error message (user-friendly, no stack trace)
```

**Non-location detection**: A simple heuristic — if the error message from the geocoder contains "No results found", respond with the redirect message. Full NLP intent detection is out of scope.

---

## Decision 4: ARIA Pattern for Chat — Live Region

**Decision**: The messages container uses `role="log"` with `aria-live="polite"` and `aria-label="Chat conversation"`. Each new bot message is appended to the DOM (not replaced), so screen readers automatically announce it.

**Rationale**:
- `role="log"` is the ARIA landmark for chat/log-style content (WCAG 2.1 SC 4.1.3)
- `aria-live="polite"` announces new messages without interrupting; assertive is too aggressive for conversational content
- Bot typing indicator uses `role="status"` with `aria-label="AI is thinking"` consistent with `LoadingSpinnerComponent`

---

## Decision 5: Component Placement — Extend MapComponent

**Decision**: Add the chat toggle button to the existing `map.component.ts` toolbar and open the chat via `NgbOffcanvasService`. The `ChatComponent` lives in `src/app/features/chat/`.

**Rationale**:
- `MapComponent` already owns the toolbar row (search bar + spinner); adding a chat icon button there is one line of template
- `ChatComponent` is opened as an Offcanvas content component — it receives `MapService`, `EsriMcpService`, `GeocodingService`, and `ChatService` via DI, not via `@Input`
- A dedicated `src/app/features/chat/` directory follows the existing feature-domain structure (`map/`, `shared/`)

---

## Decision 6: Typing Indicator — Reuse LoadingSpinnerComponent

**Decision**: While a bot response is loading, display `<app-loading-spinner [visible]="true" label="Thinking..." />` inside the chat messages area, then replace it with the bot reply on completion.

**Rationale**:
- `LoadingSpinnerComponent` already has `role="status"` and `aria-label` binding — WCAG compliant out of the box
- Consistent visual language with the search bar's loading state
- No additional component needed
