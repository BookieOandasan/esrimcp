# Developer Quickstart: AI Chat Component with ESRI MCP

**Feature**: 003-map-ai-chat  
**Date**: 2026-06-03

---

## Prerequisites

- Angular dev server running: `npm start` → `http://localhost:4200`
- .NET MCP backend running (optional but recommended): `$env:ESRI__ApiKey="..."; dotnet run --project server/EsriMcp.Api`
- `public/config.json` present with valid `esriApiKey`

---

## 1. Open the Chat Panel

Navigate to `http://localhost:4200`. The map loads. In the top toolbar, a chat icon button (💬) appears to the right of the search bar. Click it — the Bootstrap Offcanvas panel slides in from the right, displaying a welcome message:

> "Hi! I can help you find locations on the map. Try asking me to show you a place!"

---

## 2. Send a Location Query

Type "Show me Mount Fuji, Japan" in the chat input and press Enter or click Send.

**Expected**:
1. Your message appears as a right-aligned bubble.
2. A typing indicator ("Thinking...") appears briefly.
3. A bot reply appears: "Found: Mount Fuji, Yamanashi, Japan (Score: 100)"
4. The map pans and zooms to Mount Fuji.
5. Backend terminal shows a structured log entry:
   ```json
   { "feature": "chat", "query": "Show me Mount Fuji, Japan", "responseStatus": "success", "durationMs": 312 }
   ```

---

## 3. Test Error Handling

Type "xyzzy_nonexistent_place_99" and send.

**Expected**:
- Bot replies: "I couldn't find that location. Try a different place name or be more specific."
- Map does not move.
- Log entry shows `"responseStatus": "no_results"`.

---

## 4. Test Non-Location Query

Type "What is the weather like?" and send.

**Expected**:
- Bot replies: "I can help you find locations on the map — try asking me to show you a place!"
- No geocoding call made.
- Map does not move.

---

## 5. Verify Chat History Persistence

1. Send two queries successfully.
2. Click the ✕ (close) button on the Offcanvas.
3. Click the chat icon again to reopen.
4. Both previous messages are still visible.

---

## 6. Clear Chat

With messages in the chat, click "Clear chat" (top-right of chat panel).

**Expected**: All messages removed, welcome message appears again.

---

## 7. Run Unit Tests

```powershell
npm test -- --watch=false
```

All tests pass including:
- `ChatService` — processMessage success/error/no-results/clear
- `ChatComponent` — renders messages, disables input while processing
- `ChatInputComponent` — emits on submit, validates empty/long input
- `ChatMessageComponent` — renders user/bot/error bubbles with correct ARIA

---

## Integration Test Scenarios

### Scenario A — Happy Path (US1)
**Given**: App running with MCP backend active  
**When**: User types "Chicago, IL" in chat  
**Then**: Map centers on Chicago; chat shows "Found: Chicago, Illinois" bot reply

### Scenario B — No Results (US2)
**Given**: App running  
**When**: User types "asdf9876xyz"  
**Then**: Bot shows friendly no-results message; map unchanged

### Scenario C — Backend Offline (US2)
**Given**: .NET backend stopped, Angular falls back to ArcGIS locator  
**When**: User types "Paris, France" in chat  
**Then**: Geocoding still works via fallback; map centers on Paris

### Scenario D — History Persistence (US3)
**Given**: Two messages sent  
**When**: Close and reopen Offcanvas  
**Then**: Both messages visible; no duplicate welcome message
