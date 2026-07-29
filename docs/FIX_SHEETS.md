# FIX: Google Sheets not receiving registrations

## What we found

Your Apps Script API **does work**. A direct test write succeeded with:

`SIH2026-0007`

So data is being saved — often people look at the **wrong spreadsheet**, or the website was opened as a **file://** page (browser blocks Sheets), or an old **local success screen** was shown without hitting Google.

---

## Do these steps in order

### 1) Redeploy Apps Script (required)

Your live Web App is still an older version (health check does not return spreadsheet URL yet).

1. Open the Google Sheet that has the script  
2. **Extensions → Apps Script**
3. Replace all code with the latest `google-apps-script/Code.gs` from this project
4. Click **Save**
5. **Deploy → Manage deployments → Edit (pencil) → New version → Deploy**
6. Keep:
   - Execute as: **Me**
   - Who has access: **Anyone**

### 2) Find the correct spreadsheet

After redeploy, open this URL in your browser:

https://script.google.com/macros/s/AKfycbzq4KNMHY0WvdHSnY2P18iUL5GAFJBQudUgDMG6_nHw3HGpH8mAtvAXs_jDo3odosLX/exec

You should see JSON like:

```json
{
  "success": true,
  "spreadsheetName": "...",
  "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/....",
  "sheetName": "Registrations",
  "totalRegistrations": 7,
  "lastRegistrationId": "SIH2026-0007"
}
```

Click `spreadsheetUrl` — that is the sheet receiving data.  
Open the **Registrations** tab (not Sheet1).

### 3) Open the website correctly (not as a file)

In PowerShell, from the project folder:

```powershell
cd C:\Users\Lenovo\OneDrive\Desktop\SIH
python -m http.server 5500
```

Then open:

http://localhost:5500

Do **not** double-click `index.html`.

### 4) Submit a test team

Fill the form → Submit.

Success is valid only if Registration ID looks like:

`SIH2026-0008`

Then refresh the **Registrations** sheet — a new row must appear.

---

## If it still goes to the wrong sheet

1. Open your intended spreadsheet  
2. Copy the ID from the URL:

`https://docs.google.com/spreadsheets/d/PASTE_THIS_ID/edit`

3. In `Code.gs` set:

```javascript
const SPREADSHEET_ID = 'PASTE_THIS_ID';
```

4. Save + **Deploy → New version** again
