# Google Apps Script — SIH 2026 Backend

Paste `Code.gs` into the Apps Script project attached to spreadsheet:

**SIH 2026 Internal Registration**

## Quick deploy

1. Spreadsheet → **Extensions → Apps Script**
2. Paste `Code.gs` → Save
3. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy `/exec` URL → `js/config.js` → `GOOGLE_SCRIPT_URL`

Full instructions: [../docs/SETUP.md](../docs/SETUP.md)

## Endpoints

| Method | Purpose |
|--------|---------|
| `GET`  | Health check / sheet readiness |
| `POST` | Append registration (JSON body as text/plain) |

## Registration IDs

Server-generated, unique, sequential: `SIH2026-0001`, `SIH2026-0002`, …
