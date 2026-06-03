# UI Contracts: AI Chat Component with ESRI MCP

**Feature**: 003-map-ai-chat  
**Date**: 2026-06-03

---

## ChatComponent

Top-level chat panel, rendered as Bootstrap Offcanvas content. Opened by `MapComponent` via `NgbOffcanvasService`.

**File**: `src/app/features/chat/chat.component.ts`

### Inputs / Outputs

No `@Input`/`@Output` — all state flows through injected `ChatService`.

### Injected Dependencies

| Service | Usage |
|---------|-------|
| `ChatService` | Read `messages()`, `isProcessing()`; call `processMessage()`, `clearChat()` |
| `NgbActiveOffcanvas` | Call `.dismiss()` when close button clicked |

### Template Contract

| Element | Role | Behaviour |
|---------|------|-----------|
| Close button | `aria-label="Close chat"` | Calls `activeOffcanvas.dismiss()` |
| Messages container | `role="log" aria-live="polite" aria-label="Chat conversation"` | Scrollable; auto-scrolls to bottom on new message |
| Typing indicator | `<app-loading-spinner>` (while `isProcessing()`) | `role="status" aria-label="Thinking..."` |
| Clear button | `aria-label="Clear chat history"` | Calls `chatService.clearChat()` |
| Input area | `<app-chat-input>` | Emits `messageSent` |

---

## ChatInputComponent

The text field and send button at the bottom of the chat panel.

**File**: `src/app/features/chat/components/chat-input/chat-input.component.ts`

### Inputs

| Name | Type | Description |
|------|------|-------------|
| `disabled` | `InputSignal<boolean>` | Disables input + button while a query is processing |

### Outputs

| Name | Type | Description |
|------|------|-------------|
| `messageSent` | `OutputEmitterRef<string>` | Emits the trimmed text string when user submits |

### Validation

- Empty or whitespace-only text: does not emit; shows `aria-describedby` hint "Please enter a location"
- Text > 500 characters: truncated to 500 before emit

### ARIA

- `<input>` has `aria-label="Type a location to find on the map"` and `aria-disabled` bound to `disabled()`
- Send button has `aria-label="Send message"`
- Form has `aria-busy` bound to `disabled()`

---

## ChatMessageComponent

Renders a single `ChatMessage` bubble.

**File**: `src/app/features/chat/components/chat-message/chat-message.component.ts`

### Inputs

| Name | Type | Description |
|------|------|-------------|
| `message` | `InputSignal<ChatMessage>` | The message to render |

### Template Contract

| Condition | Class | ARIA |
|-----------|-------|------|
| `sender === 'user'` | `chat-bubble--user` (right-aligned) | `aria-label="You: {text}"` |
| `sender === 'bot' && status === 'success'` | `chat-bubble--bot` (left-aligned) | `aria-label="Assistant: {text}"` |
| `sender === 'bot' && status === 'error'` | `chat-bubble--bot chat-bubble--error` | `role="alert" aria-label="Error: {text}"` |

---

## ChatService

**File**: `src/app/core/services/chat.service.ts`  
Provided in root — singleton survives Offcanvas open/close.

### Public API

| Method / Signal | Signature | Description |
|-----------------|-----------|-------------|
| `messages` | `Signal<ChatMessage[]>` | Current conversation history (read-only) |
| `isProcessing` | `Signal<boolean>` | True while geocoding is in-flight |
| `processMessage(text: string)` | `Promise<void>` | Adds user message, invokes geocoding, adds bot reply, calls `MapService.centerOn()` |
| `clearChat()` | `void` | Resets messages to `[welcomeMessage]` |

### Structured Logging (Constitution V)

Every `processMessage()` invocation logs:
```json
{
  "timestamp": "ISO8601",
  "feature": "chat",
  "query": "<text>",
  "responseStatus": "success" | "error" | "no_results",
  "durationMs": 0
}
```

---

## MapComponent Changes

**File**: `src/app/features/map/map.component.ts`

### Addition

Add a chat toggle button to the existing toolbar template:

```html
<button class="btn btn-outline-secondary ms-2"
        aria-label="Open AI chat"
        (click)="openChat()">
  <i class="bi bi-chat-dots"></i>
</button>
```

Add `openChat()` method that calls `NgbOffcanvasService.open(ChatComponent, { position: 'end' })`.

**No changes** to `onSearch()`, `ngOnInit()`, `ngOnDestroy()`, or MCP session management.
