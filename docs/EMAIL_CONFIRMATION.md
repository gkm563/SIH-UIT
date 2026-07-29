# Email confirmation (Team Leader)

After a successful registration, Apps Script sends an email to the **Team Leader Personal Email ID** with:

- Registration ID & timestamp
- Team name / size
- Full Team Leader details
- All Team Member details

## Deploy

1. Open the spreadsheet → **Extensions → Apps Script**
2. Paste the latest `google-apps-script/Code.gs`
3. **Save**
4. **Deploy → Manage deployments → Edit → New version → Deploy**

Email is sent by the Google account that owns the script (`MailApp`).
Registration is still saved even if email sending fails.
