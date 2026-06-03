# Implementation Plan: AI Chat Component with ESRI MCP

**Branch**: `003-map-ai-chat` | **Date**: 2026-06-03 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/003-map-ai-chat/spec.md`

## Summary

Add an Angular standalone chat panel to the existing map application. Users type natural language location queries; the system routes them through the existing `EsriMcpService` / `GeocodingService` fallback chain, replies in the chat with the geocoded display name, and simultaneously pans the map to the found location. The panel is a Bootstrap Offcanvas (end placement) toggled from the `MapComponent` toolbar, with full keyboard navigation and ARIA live-region announcements. Chat history is held in a singleton `ChatService` so it survives Offcanvas close/reopen cycles.

## Technical Context

**Language/Version**: TypeScript / Angular 21 (existing project)  
**Primary Dependencies**: `@ng-bootstrap/ng-bootstrap` Offcanvas (already installed), Bootstrap 5 SCSS (already imported), Angular Signals (framework built-in)  
**Storage**: In-memory only (singleton `ChatService`); no persistence  
**Testing**: Vitest (Angular 21 default — existing project uses `vi.fn()`, `vi.spyOn()`)  
**Target Platform**: Desktop browser, `http://localhost:4200` (existing Angular dev server)  
**Project Type**: Angular feature addition (new feature module + service, minimal changes to existing files)  
**Performance Goals**: Chat panel open/close ≤ 300 ms; geocoding response displayed ≤ 3 s end-to-end  
**Constraints**: No new npm packages; Bootstrap Offcanvas + existing services only; mobile out of scope  
**Scale/Scope**: Single-user, session-only conversation history; no server-side persistence

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design — both pass.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Angular Component Architecture | ✅ PASS | New `src/app/features/chat/` feature directory with standalone components. `ChatService` provided in root. `MapComponent` extended with one button and `openChat()` method only — no cross-feature component references. |
| II. Bootstrap-First UI | ✅ PASS | Offcanvas panel, chat bubbles, and input group all use Bootstrap utility classes. Custom SCSS scoped to component files only for bubble alignment (no global overrides). |
| III. ESRI MCP Integration | ✅ PASS | All geocoding in `ChatService.processMessage()` goes through `EsriMcpService.callTool()` first, with `GeocodingService` fallback — identical to `MapComponent.onSearch()`. No direct ArcGIS REST calls. |
| IV. Test-First Development | ✅ PASS | Vitest spec files written before implementation for `ChatService`, `ChatComponent`, `ChatInputComponent`, `ChatMessageComponent`. |
| V. Observability & Accessibility | ✅ PASS | Every `processMessage()` call logs a structured JSON entry (timestamp, feature, query, status, durationMs). Chat messages container uses `role="log" aria-live="polite"`. Error bubbles use `role="alert"`. All interactive elements have `aria-label`. |

## Project Structure

### Documentation (this feature)

```text
specs/003-map-ai-chat/
├── plan.md              ← This file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── ui-contracts.md ← Component @Input/@Output + ChatService API contracts
└── tasks.md             ← Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
src/app/core/models/
└── app.types.ts                         ← ADD: ChatMessageSender, ChatMessageStatus, ChatMessage types

src/app/core/services/
└── chat.service.ts                      ← NEW: singleton ChatSession state + processMessage() + clearChat()

src/app/features/chat/                   ← NEW feature directory
├── chat.component.ts                    ← Offcanvas content: message list + input + clear button
├── chat.component.html                  ← role="log" aria-live="polite" container
├── chat.component.spec.ts               ← Vitest: renders messages, disables input while processing
└── components/
    ├── chat-input/
    │   ├── chat-input.component.ts      ← input() disabled, output() messageSent
    │   └── chat-input.component.spec.ts ← Vitest: emits on submit, validates empty/long
    └── chat-message/
        ├── chat-message.component.ts    ← input() message, renders user/bot/error bubble
        └── chat-message.component.spec.ts ← Vitest: correct classes + ARIA per sender/status

src/app/features/map/
└── map.component.ts                     ← ADD: chat toggle button + openChat() via NgbOffcanvasService

src/styles.scss                          ← ADD: minimal chat bubble alignment SCSS (scoped)
```

**No new routes.** `ChatComponent` is opened as Offcanvas content, not a routed view.  
**No new npm packages.** `@ng-bootstrap/ng-bootstrap` and Bootstrap 5 already installed.

## Complexity Tracking

> No Constitution violations — table not required.
