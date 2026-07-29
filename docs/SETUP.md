# SIH 2026 Internal Registration — Google Sheets Setup Guide

This guide walks you through connecting the registration website to **Google Sheets** using a **Google Apps Script Web App** (`doPost` API).

---

## Folder structure

```
SIH/
├── index.html
├── assets/
│   └── logo.svg
├── css/
│   └── styles.css
├── js/
│   ├── config.js          ← paste Web App URL here
│   ├── api.js             ← Fetch client for Apps Script
│   ├── storage.js         ← local draft / receipt cache
│   ├── validation.js
│   └── app.js
├── google-apps-script/
│   └── Code.gs            ← paste into Apps Script editor
└── docs/
    └── SETUP.md           ← this file
```

---

## 1. Google Sheet setup

1. Open [Google Sheets](https://sheets.google.com) and create a new spreadsheet.
2. Rename the spreadsheet to exactly:
   - **SIH 2026 Internal Registration**
3. You can leave Sheet1 as-is. The script will create (or reuse) a worksheet named:
   - **Registrations**
4. Headers are created automatically on first request. Expected columns:

| Timestamp | Registration ID | Team Name | Total Team Members | Team Leader … | Member 1 … | … | Member 5 … | Declaration Accepted | Submission Status |

Unused member columns stay blank when the team has fewer than 6 people (leader + up to 5 members).

---

## 2. Apps Script setup

1. In the spreadsheet, open **Extensions → Apps Script**.
2. Delete any default code in `Code.gs`.
3. Copy the full contents of `google-apps-script/Code.gs` from this project and paste it into the editor.
4. Click **Save** (disk icon) and name the project, e.g. `SIH 2026 Registration API`.
5. (Optional) In the Apps Script editor, select function `testSubmit_` → **Run**.
   - Authorize the script when prompted (review permissions → Allow).
   - Check **Executions** and the **Registrations** sheet for a test row.
6. If your script is **not** bound to the spreadsheet (standalone), set this near the top of `Code.gs`:

```javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
```

The spreadsheet ID is the long string in the sheet URL:

`https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit`

---

## 3. Deploy as Web App

1. In Apps Script: **Deploy → New deployment**.
2. Click the gear / type selector → choose **Web app**.
3. Configure:

| Setting | Value |
|--------|--------|
| Description | SIH 2026 Internal Registration API |
| Execute as | **Me** (your Google account) |
| Who has access | **Anyone** |

4. Click **Deploy**.
5. Copy the **Web app URL** (ends with `/exec`).
6. If you change `Code.gs` later, create a **New version** via **Deploy → Manage deployments → Edit → New version**, otherwise the live URL keeps serving old code.

> Security note: “Anyone” means anyone with the URL can POST. The script still validates required fields and sanitizes input. Do not publish the URL publicly beyond your college portal if you can avoid it. For stronger protection later, add a shared secret header/token check in `doPost`.

---

## 4. Connect the website (Fetch API)

1. Open `js/config.js`.
2. Paste your Web App URL:

```javascript
const AppConfig = {
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/XXXXXXXX/exec',
  REQUEST_TIMEOUT_MS: 45000,
  APP_NAME: 'SIH 2026 Internal Registration'
};
```

3. Serve the site over HTTP(S) (not only `file://` if you hit CORS/browser limits). Examples:

```bash
# Python
python -m http.server 5500

# Node (npx)
npx serve .
```

4. Open `http://localhost:5500` and submit a test registration.

### How the frontend submits

On **Submit**, the site:

1. Validates the current (and all) sections client-side.
2. Shows a loading overlay and disables the Submit button.
3. Sends JSON via `fetch` **without page refresh**:

```javascript
fetch(AppConfig.GOOGLE_SCRIPT_URL, {
  method: 'POST',
  mode: 'cors',
  redirect: 'follow',
  headers: {
    // text/plain avoids CORS preflight (Apps Script does not handle OPTIONS)
    'Content-Type': 'text/plain;charset=utf-8'
  },
  body: JSON.stringify(fields)
});
```

4. On success, shows the confirmation screen with **Registration ID**, date/time, team name, **Download Receipt**, and **Return to Home**.
5. On failure, shows the API error message in the form alert.

### Why `text/plain`?

Browsers send a CORS **OPTIONS** preflight for `Content-Type: application/json`. Google Apps Script Web Apps do not reliably answer that preflight. Sending a JSON string as `text/plain` is the standard production workaround; `doPost` still parses `e.postData.contents` as JSON.

---

## 5. API contract

### POST — submit registration

**Request body** (flat field map):

```json
{
  "teamName": "Code Warriors",
  "teamSize": "4",
  "leader_fullName": "...",
  "leader_rollNumber": "...",
  "leader_collegeId": "...",
  "leader_branch": "CSE",
  "leader_year": "Third Year",
  "leader_semester": "5",
  "leader_gender": "Male",
  "leader_email": "leader@college.edu",
  "leader_whatsapp": "9876543210",
  "member1_fullName": "...",
  "member1_rollNumber": "...",
  "...": "...",
  "declare_truth": true,
  "declare_internal": true,
  "declare_contact": true
}
```

**Success response:**

```json
{
  "success": true,
  "registrationId": "SIH2026-0042",
  "timestamp": "2026-07-29 12:45:01",
  "message": "Registration submitted successfully."
}
```

**Validation failure:**

```json
{
  "success": false,
  "message": "Required fields are missing."
}
```

### GET — health check

Open the Web App URL in a browser. You should see JSON like:

```json
{
  "success": true,
  "message": "SIH 2026 Internal Registration API is online.",
  "sheetReady": true,
  "sheetName": "Registrations"
}
```

---

## 6. Testing instructions

### A. Backend only

1. In Apps Script, run `testSubmit_`.
2. Confirm a new row appears under **Registrations**.
3. Confirm **Registration ID** looks like `SIH2026-0001`.
4. Run again → ID should become `SIH2026-0002` (never reused).

### B. API from browser

1. Deploy the Web App.
2. Visit the `/exec` URL (GET) → expect `success: true`.
3. From DevTools console on your site origin:

```javascript
fetch(AppConfig.GOOGLE_SCRIPT_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify({
    teamName: 'Console Test',
    teamSize: '2',
    leader_fullName: 'A',
    leader_rollNumber: 'R1',
    leader_collegeId: 'E1',
    leader_branch: 'CSE',
    leader_year: 'First Year',
    leader_semester: '1',
    leader_gender: 'Male',
    leader_email: 'a@test.com',
    leader_whatsapp: '9876543210',
    member1_fullName: 'B',
    member1_rollNumber: 'R2',
    member1_collegeId: 'E2',
    member1_branch: 'CSE',
    member1_year: 'First Year',
    member1_semester: '1',
    member1_gender: 'Female',
    member1_email: 'b@test.com',
    member1_whatsapp: '9876543211',
    declare_truth: true,
    declare_internal: true,
    declare_contact: true
  })
}).then(r => r.json()).then(console.log);
```

### C. Full website flow

1. Set `GOOGLE_SCRIPT_URL` in `js/config.js`.
2. Open the site → fill all sections → Submit.
3. Confirm loading spinner appears and Submit is disabled.
4. Confirm success screen shows server-issued `SIH2026-XXXX`.
5. Confirm the spreadsheet gained a new **appended** row (previous rows untouched).
6. Download the receipt and verify the Registration ID matches the sheet.
7. Test a team of size 3 → Member 3–5 columns should be blank.

### D. Failure cases

| Case | Expected |
|------|----------|
| Empty `GOOGLE_SCRIPT_URL` | Clear config error on submit |
| Missing declaration checkbox | Client blocks; if forced, API rejects |
| Invalid email / phone | Client + server validation |
| Wrong Web App URL | Network / unexpected response error |
| Concurrent submits | Script lock + unique IDs |

---

## 7. Registration ID rules

- Format: `SIH2026-0001`, `SIH2026-0002`, …
- Generated **only on the server** (never trust client IDs).
- Uses a **script lock** during ID generation + append to avoid duplicates under load.
- Scans existing IDs and uses `max + 1` (safe if rows are deleted).
- Double-checks the candidate ID does not already exist before writing.

---

## 8. Production checklist

- [ ] Spreadsheet named **SIH 2026 Internal Registration**
- [ ] Worksheet **Registrations** with frozen header row
- [ ] Web App deployed: Execute as **Me**, access **Anyone**
- [ ] Latest code version deployed after every script change
- [ ] `js/config.js` contains the live `/exec` URL
- [ ] Site served over HTTPS in production
- [ ] Test submit verified in the sheet
- [ ] Restrict spreadsheet sharing to organizers (View/Edit as needed)
- [ ] Optional: back up the sheet or enable version history

---

## 9. Troubleshooting

| Problem | Fix |
|---------|-----|
| CORS / failed fetch | Use `text/plain` body (already in `api.js`); deploy access = Anyone; use New version after code changes |
| `Authorization required` HTML instead of JSON | Redeploy with **Anyone**; open URL in an incognito window to verify |
| Sheet not updating | Confirm script is bound to the correct spreadsheet or `SPREADSHEET_ID` is set |
| Duplicate / skipped IDs | Normal if test rows deleted; IDs never reuse an existing value |
| “Server is busy” | Lock timeout under heavy load — user should retry |

---

## Support contact (fill in for your college)

- Portal owner:
- Spreadsheet owner Google account:
- Web App deployment ID:
