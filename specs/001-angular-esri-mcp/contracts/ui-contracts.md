# UI Component Contracts

**Date**: 2026-06-03
**Branch**: `001-angular-esri-mcp`

Defines the `@Input` / `@Output` contracts for all public-facing Angular components.
Per Constitution Principle I, components communicate exclusively via these bindings or
injectable services — no direct component-to-component references across modules.

---

## MapCanvasComponent

**Selector**: `app-map-canvas`
**Module**: `features/map`
**Responsibility**: Hosts the ArcGIS `MapView` DOM element; delegates all map
initialization and destruction to `MapService`.

### Inputs

None. Map state is driven entirely by `MapService` (injected).

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `mapReady` | `EventEmitter<void>` | Emitted when MapView reaches `ready` status |
| `mapError` | `EventEmitter<string>` | Emitted with error message when map fails to init |

### Accessibility

- Host `<div>` MUST have `role="application"` and `aria-label="Interactive map"`.
- Zoom/pan controls MUST have accessible keyboard equivalents (provided by ArcGIS SDK).

---

## MapSearchComponent

**Selector**: `app-map-search`
**Module**: `features/map`
**Responsibility**: Search bar for geocoding input; dispatches search results to parent
via output events. Does not directly call any service — the parent (or `AppComponent`)
wires search results to `MapService.centerOn()`.

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `disabled` | `boolean` | `false` | Disables input while a search is in progress |
| `placeholder` | `string` | `'Search for a place...'` | Input placeholder text |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `searchSubmitted` | `EventEmitter<string>` | Emits the query string when user submits |
| `searchCleared` | `EventEmitter<void>` | Emitted when user clears the search field |

### Accessibility

- `<input>` MUST have `aria-label="Search for a location"`.
- Submit button MUST have `aria-label="Search"`.
- Loading state: `aria-busy="true"` on the form when `disabled === true`.

---

## ErrorBannerComponent

**Selector**: `app-error-banner`
**Module**: `features/shared`
**Responsibility**: Displays a dismissable error message at the top of the viewport.

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `message` | `string \| null` | `null` | Error text; `null` hides the banner |
| `dismissable` | `boolean` | `true` | Shows a dismiss (×) button when `true` |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `dismissed` | `EventEmitter<void>` | Emitted when user clicks the dismiss button |

### Accessibility

- Banner `<div>` MUST have `role="alert"` and `aria-live="assertive"`.
- Dismiss button MUST have `aria-label="Dismiss error"`.

---

## LoadingSpinnerComponent

**Selector**: `app-loading-spinner`
**Module**: `features/shared`
**Responsibility**: Visual loading indicator shown during async operations.

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `visible` | `boolean` | `false` | Controls spinner visibility |
| `label` | `string` | `'Loading...'` | Screen reader text for the spinner |

### Outputs

None.

### Accessibility

- Spinner host MUST have `role="status"` and `aria-label` bound to `label` input.
- When `visible === false`, the element MUST be hidden from the accessibility tree
  (`aria-hidden="true"` or `*ngIf`).
