# Quickstart: Angular Web App with ESRI MCP Connection

**Date**: 2026-06-03
**Branch**: `001-angular-esri-mcp`

---

## Prerequisites

- Node.js 20 LTS (check: `node --version`)
- Angular CLI 17+: `npm install -g @angular/cli`
- Access to an ESRI MCP server endpoint URL
- A valid ArcGIS API key (obtain from [developers.arcgis.com](https://developers.arcgis.com))

---

## 1. Install Dependencies

```bash
npm install
```

---

## 2. Configure the Runtime API Key

The API key is NEVER hardcoded. Copy the config template and populate it:

```bash
cp src/assets/config.json.template src/assets/config.json
```

Edit `src/assets/config.json`:

```json
{
  "esriApiKey": "<your-arcgis-api-key>",
  "mcpServerUrl": "<your-esri-mcp-server-url>"
}
```

> `src/assets/config.json` is gitignored. Do not commit it.

---

## 3. Start the Development Server

```bash
ng serve
```

Open `http://localhost:4200` in your browser. The map should load and be interactive.

---

## 4. Verify the ESRI MCP Connection

1. Open browser DevTools → Console
2. Confirm you see a structured log entry:
   ```
   [EsriMcpService] Connected to MCP server at <url>
   ```
3. Type a place name in the search bar (e.g., "Seattle, WA") and press Enter.
4. Confirm the map centers on the location and a marker appears.
5. Confirm a structured log entry appears:
   ```json
   { "tool": "geocode_location", "responseStatus": "success", ... }
   ```

---

## 5. Run Tests

```bash
# Unit tests (Jasmine/Karma)
ng test

# Integration/E2E tests (Playwright) — requires ESRI_API_KEY env var
npx playwright test
```

---

## 6. Production Build

```bash
ng build --configuration production
```

Before serving, populate `dist/<project>/browser/assets/config.json` with production
values using your CI/CD pipeline or container entrypoint:

```bash
# Example: Docker entrypoint
envsubst < src/assets/config.json.template > dist/<project>/browser/assets/config.json
```

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Map shows blank/grey | Missing or invalid API key | Check `src/assets/config.json`; verify key at developers.arcgis.com |
| "Configuration error" on startup | `config.json` missing or malformed | Run `cp src/assets/config.json.template src/assets/config.json` and populate |
| "Service unavailable" banner | MCP server unreachable | Verify `mcpServerUrl` in `config.json`; check server is running |
| Search returns no results | Invalid query or geocode miss | Try a well-known city name; check DevTools console for MCP error details |
