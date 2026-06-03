---
description: "Task list for AI Chat Component with ESRI MCP"
---

# Tasks: AI Chat Component with ESRI MCP

**Input**: Design documents from `/specs/003-map-ai-chat/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: TDD is NON-NEGOTIABLE per Constitution Principle IV. Test tasks are included
and MUST be written before their corresponding implementation tasks (Red-Green-Refactor).

**Organization**: Tasks are grouped by user story to enable independent implementation
and testing. No new npm packages are required — all dependencies already installed.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure, add new types, and create the ChatService skeleton that all user stories depend on.

- [x] T001 Create directory structure: `src/app/features/chat/components/chat-input/` and `src/app/features/chat/components/chat-message/`
- [x] T002 Add `ChatMessageSender`, `ChatMessageStatus`, and `ChatMessage` interface to src/app/core/models/app.types.ts (append to existing file — do not replace existing types)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: `ChatService` and its tests must exist and pass before any component work begins.

**⚠️ CRITICAL**: No user story component work can begin until this phase is complete.

- [x] T003 Write Vitest unit tests for ChatService in src/app/core/services/chat.service.spec.ts: test cases: (a) initialises with one welcome bot message, (b) `processMessage()` with mocked `EsriMcpService` (sessionStatus='active') adds user message then bot success reply and calls `MapService.centerOn()`, (c) `processMessage()` with MCP inactive falls back to mocked `GeocodingService`, (d) geocoding error adds bot error message with status='error', (e) `clearChat()` resets messages to single welcome message, (f) `isProcessing` is true during in-flight call and false after
- [x] T004 Implement ChatService in src/app/core/services/chat.service.ts: `providedIn: 'root'`; signals `messages = signal<ChatMessage[]>([welcomeMessage])` and `isProcessing = signal<boolean>(false)`; `processMessage(text: string): Promise<void>` — validates non-empty, adds user message, adds pending bot message, calls EsriMcpService or GeocodingService fallback, replaces pending with success/error reply, calls `MapService.centerOn()` on success, logs structured JSON (timestamp, feature='chat', query, responseStatus, durationMs); `clearChat()` resets to `[welcomeMessage]`

**Checkpoint**: `ChatService` tests pass — all geocoding, fallback, error, and clear scenarios verified.

---

## Phase 3: User Story 1 — Ask a Geospatial Question via Chat (Priority: P1) 🎯 MVP

**Goal**: User opens chat, types a location, sees a bot reply, and the map moves to the found location.

**Independent Test**: Open the Offcanvas chat panel → type "Show me Mount Fuji" → bot reply "Found: Mount Fuji, Yamanashi, Japan" appears → map centers on Mount Fuji — all without using the search bar.

### Tests for User Story 1 (TDD — write FIRST, ensure they FAIL)

- [x] T005 [P] [US1] Write Vitest tests for ChatMessageComponent in src/app/features/chat/components/chat-message/chat-message.component.spec.ts: test (a) user message renders right-aligned with aria-label "You: {text}", (b) successful bot message renders left-aligned with aria-label "Assistant: {text}", (c) error bot message has role="alert"
- [x] T006 [P] [US1] Write Vitest tests for ChatInputComponent in src/app/features/chat/components/chat-input/chat-input.component.spec.ts: test (a) emits `messageSent` with trimmed text on form submit, (b) does not emit for empty input, (c) input and button are disabled when `disabled()` is true, (d) form has aria-busy="true" when disabled
- [x] T007 [P] [US1] Write Vitest tests for ChatComponent in src/app/features/chat/chat.component.spec.ts: mock ChatService; test (a) renders all messages from `chatService.messages()`, (b) calls `chatService.processMessage()` when `messageSent` emits, (c) passes `chatService.isProcessing()` as `disabled` to ChatInputComponent, (d) shows LoadingSpinnerComponent when `isProcessing()` is true

### Implementation for User Story 1

- [x] T008 [P] [US1] Implement ChatMessageComponent in src/app/features/chat/components/chat-message/chat-message.component.ts: standalone; `input()` signal for `message: ChatMessage`; template renders Bootstrap card/bubble with conditional classes for user (right-aligned `ms-auto bg-primary text-white`) vs bot (left-aligned `bg-light`); error status adds `role="alert"`; aria-label bound to sender and text
- [x] T009 [P] [US1] Implement ChatInputComponent in src/app/features/chat/components/chat-input/chat-input.component.ts: standalone; `input()` signal for `disabled: boolean`; `output()` `messageSent: OutputEmitterRef<string>`; FormsModule `[(ngModel)]`; Bootstrap `input-group`; `aria-label="Type a location to find on the map"`; `aria-busy` bound to `disabled()`; submit handler validates non-empty and trims text ≤500 chars before emitting and clearing input
- [x] T010 [US1] Implement ChatComponent in src/app/features/chat/chat.component.ts: standalone; inject `ChatService`, `NgbActiveOffcanvas`, `LoadingSpinnerComponent`; template: header with title + close button (`aria-label="Close chat"`); messages container (`role="log" aria-live="polite" aria-label="Chat conversation"`) iterating over `chatService.messages()` with `@for (msg of chatService.messages(); track msg.id)`; `<app-loading-spinner>` shown when `chatService.isProcessing()`; `<app-chat-input [disabled]="chatService.isProcessing()" (messageSent)="onMessageSent($event)" />`; "Clear chat" button calling `chatService.clearChat()`; `onMessageSent(text)` calls `chatService.processMessage(text)`
- [x] T011 [US1] Add chat toggle to src/app/features/map/map.component.ts: inject `NgbOffcanvasService`; add `openChat()` method calling `this.offcanvasService.open(ChatComponent, { position: 'end', ariaLabelledBy: 'chat-panel-title' })`; add toggle button to the toolbar template `<button class="btn btn-outline-secondary ms-2" aria-label="Open AI chat" (click)="openChat()">💬</button>`; import `ChatComponent` and `NgbOffcanvasModule` in component imports array

**Checkpoint**: US1 fully functional — chat panel opens, messages appear, map moves on geocode success.

---

## Phase 4: User Story 2 — Receive Informative Error Feedback (Priority: P2)

**Goal**: Failed or ambiguous queries show friendly bot error messages; the map does not move.

**Independent Test**: Type "xyzzy12345nonexistent" → bot reply "I couldn't find that location. Try a different place name." → map unchanged → conversation history intact.

### Tests for User Story 2 (TDD — write FIRST, ensure they FAIL)

- [x] T012 [P] [US2] Write Vitest tests for ChatService error scenarios in src/app/core/services/chat.service.spec.ts (extend T003 file): test (a) geocoder "No results found" error produces bot message with friendly text (not the raw error), (b) service-unavailable error produces "temporarily unavailable" bot message with status='error', (c) empty string input does not add any message and does not call geocoding

### Implementation for User Story 2

- [x] T013 [US2] Update ChatService `processMessage()` error handling in src/app/core/services/chat.service.ts: distinguish "No results" errors (bot reply with status='success', text="I couldn't find that location. Try a different place name or be more specific.") from service errors (bot reply with status='error', text="The map service is temporarily unavailable. Please try again shortly."); ensure raw error messages, stack traces, and API keys never appear in bot reply text
- [x] T014 [P] [US2] Update ChatComponent template in src/app/features/chat/chat.component.ts: ensure error `ChatMessage` bubbles render `ChatMessageComponent` with `role="alert"` (already in T010 via ChatMessageComponent contract — verify the binding flows end-to-end)

**Checkpoint**: US2 fully functional — all error paths display user-friendly messages, no raw errors visible.

---

## Phase 5: User Story 3 — Manage Chat Panel Visibility (Priority: P3)

**Goal**: Chat panel can be closed and reopened; history persists; "Clear chat" resets to welcome message.

**Independent Test**: Send two messages → close Offcanvas → reopen → both messages visible → click "Clear chat" → only welcome message remains.

### Tests for User Story 3 (TDD — write FIRST, ensure they FAIL)

- [x] T015 [P] [US3] Write Vitest test for history persistence across ChatComponent destroy/create in src/app/features/chat/chat.component.spec.ts (extend T007 file): create ChatComponent with two messages in mocked ChatService, destroy fixture, create new ChatComponent fixture with same service — assert messages() still contains two messages (proves singleton service retains state)
- [x] T016 [P] [US3] Write Vitest test for clearChat in src/app/features/chat/chat.component.spec.ts (extend T007 file): call `chatService.clearChat()` → assert `chatService.messages()` has exactly one message (the welcome message)

### Implementation for User Story 3

- [x] T017 [US3] Verify ChatService singleton retains state across component lifecycle in src/app/core/services/chat.service.ts: confirm `providedIn: 'root'` is set (done in T004); confirm `clearChat()` resets to exactly `[welcomeMessage]` with a fresh timestamp (already implemented in T004 — verify test T016 passes against existing implementation without code changes)
- [x] T018 [US3] Add "Clear chat" button accessibility in src/app/features/chat/chat.component.ts: ensure `aria-label="Clear chat history"` is present on the clear button; add `@if (chatService.messages().length > 1)` guard so the button only appears when there is something to clear (hiding it when only the welcome message is shown)

**Checkpoint**: All three user stories independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: WCAG verification, visual polish, test suite validation, structured log check.

- [x] T019 [P] Add chat bubble alignment styles to src/styles.scss: `.chat-bubble--user { max-width: 75%; }` and `.chat-bubble--bot { max-width: 75%; }` — keep scoped to avoid conflicts with Bootstrap utilities; add `#chat-messages { overflow-y: auto; max-height: calc(100vh - 200px); }` for scrollable message area
- [x] T020 [P] Verify WCAG compliance: confirm `role="log"`, `aria-live="polite"` on messages container; confirm all buttons have `aria-label`; confirm `LoadingSpinnerComponent` in chat shows `role="status"`; confirm error bubbles have `role="alert"`; keyboard-navigate the full chat flow (Tab to button → Enter to open → Tab to input → type → Enter to send → Tab to close → Escape to dismiss)
- [x] T021 Run full Vitest suite `npm test -- --watch=false` and confirm all tests pass including the new chat specs
- [x] T022 [P] Run the quickstart.md Scenario A (happy path), B (no results), C (backend offline fallback), and D (history persistence) manually and confirm all four scenarios behave as documented

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; T001 and T002 can run in parallel
- **Foundational (Phase 2)**: Depends on Phase 1 (T002 types must exist before ChatService) — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 (ChatService) — provides the full chat interaction
- **US2 (Phase 4)**: Depends on Phase 2 (ChatService error handling) — can overlap with US1 impl since it extends the same service
- **US3 (Phase 5)**: Depends on Phase 2 (ChatService singleton) + US1 ChatComponent (clear button is in ChatComponent) — largely independent of US2
- **Polish (Phase 6)**: Depends on all user story phases complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — delivers full chat + map interaction
- **US2 (P2)**: Extends ChatService from Phase 2; does not depend on US1 components
- **US3 (P3)**: Depends on ChatService singleton (Phase 2) and ChatComponent clear button (US1 T010)

### Within Each User Story

1. Tests MUST be written and MUST FAIL before implementation begins
2. Models (app.types.ts) before services (ChatService)
3. Service before components that depend on it
4. Child components (ChatMessage, ChatInput) before parent (ChatComponent)
5. ChatComponent before MapComponent integration

### Parallel Opportunities

- T001, T002 can run in parallel (Phase 1)
- T005, T006, T007 (US1 tests) can run in parallel
- T008, T009 (child component impls) can run in parallel — different files, no dependency
- T012 (US2 tests) can run in parallel with T008/T009 (different file)
- T015, T016 (US3 tests) can run in parallel
- T019, T020 (Polish) can run in parallel

---

## Parallel Example: User Story 1 Tests

```text
# Launch all test authoring tasks for US1 together:
Task T005: "Write ChatMessageComponent tests in chat-message.component.spec.ts"
Task T006: "Write ChatInputComponent tests in chat-input.component.spec.ts"
Task T007: "Write ChatComponent tests in chat.component.spec.ts"

# Then launch child component implementations in parallel:
Task T008: "Implement ChatMessageComponent" (after T005 fails as expected)
Task T009: "Implement ChatInputComponent" (after T006 fails as expected)

# Then implement parent (depends on T008 + T009):
Task T010: "Implement ChatComponent" (after T007 fails and T008+T009 done)
Task T011: "Add chat toggle to MapComponent" (after T010 done)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational ChatService (T003–T004)
3. Complete Phase 3: US1 components + MapComponent integration (T005–T011)
4. **STOP and VALIDATE**: Open browser → click chat icon → type "Seattle" → map moves → bot replies
5. Demo working chat as MVP

### Incremental Delivery

1. Phase 1 + Phase 2 → ChatService ready
2. Phase 3: Full chat interaction → US1 independent test passes → Demo 1
3. Phase 4: Error feedback → US2 independent test passes → Demo 2
4. Phase 5: Panel management → US3 independent test passes → Demo 3
5. Phase 6: Polish → all tests pass → production-ready

---

## Notes

- `[P]` = different files, no dependency on incomplete tasks — safe to run in parallel
- `[US1/US2/US3]` label maps each task to its user story for traceability
- TDD is non-negotiable (Constitution IV): every spec file MUST exist and FAIL before implementation
- No new npm packages — `@ng-bootstrap/ng-bootstrap` and Bootstrap 5 already installed
- ChatService is `providedIn: 'root'` — this is intentional so history survives Offcanvas lifecycle
- Never expose raw error messages, stack traces, or API key values in bot reply text (Constitution V)
- Structured chat log (timestamp, feature, query, responseStatus, durationMs) required for every `processMessage()` call
