# Fix: Confirmation email not arriving

## Most common cause

Redeploy alone is **not enough**. Google must grant **Mail permission** once.

## Do this exactly

### Step 1 — Authorize mail (required)

1. Open spreadsheet → **Extensions → Apps Script**
2. Paste the latest `Code.gs` (and optionally `appsscript.json` via Project Settings → Show "appsscript.json")
3. At the top function dropdown, select: **`authorizeMailPermissions_`**
4. Click **Run**
5. Click **Review permissions** → choose your Google account → **Allow**
6. You should receive email: **SIH 2026 Mail Test OK**
7. If that test mail does not arrive, check Spam. If still nothing, mail is blocked on that Google account.

### Step 2 — Redeploy the SAME Web App

1. **Deploy → Manage deployments**
2. Click the **pencil (Edit)** on the existing Web App  
   - Do **not** create a brand-new deployment (that changes the URL)
3. Version: **New version**
4. Execute as: **Me**
5. Who has access: **Anyone**
6. **Deploy**
7. Confirm the Web App URL still matches `js/config.js`

Current site URL:

`https://script.google.com/macros/s/AKfycbzq4KNMHY0WvdHSnY2P18iUL5GAFJBQudUgDMG6_nHw3HGpH8mAtvAXs_jDo3odosLX/exec`

### Step 3 — Test registration

Submit a real team. On success screen check **Confirmation Email** status.

Also check Google Sheet column **Email Status**:
- `Sent to email@...` → mail API succeeded
- `FAILED: ...` → exact error reason

## Notes

- Mail is sent from the Google account that owns the Apps Script
- Consumer Gmail has a daily send quota
- Always check Team Leader **Inbox + Spam**
