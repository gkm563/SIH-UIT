/**
 * =============================================================================
 * Smart India Hackathon (SIH) 2026 – Internal Registration Backend
 * Google Apps Script Web App (doPost / doGet)
 * =============================================================================
 *
 * SETUP:
 * 1. Create a Google Spreadsheet named "SIH 2026 Internal Registration"
 * 2. Extensions → Apps Script → paste this file as Code.gs
 * 3. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web App URL into js/config.js on the website
 *
 * Spreadsheet binding:
 * - Prefer binding this script TO the target spreadsheet (Extensions → Apps Script
 *   from the sheet), then SpreadsheetApp.getActiveSpreadsheet() works.
 * - Or set SPREADSHEET_ID below if the script is standalone.
 * =============================================================================
 */

// Bound spreadsheet — all registrations are written here
const SPREADSHEET_ID = '1vbDZMAJJgZpELJpfGtdPCres5puMHxe3ac4vvLIoNbs';

const SHEET_NAME = 'Registrations';
const REG_ID_PREFIX = 'SIH2026-';
const MAX_MEMBERS = 5; // Member 1 … Member 5 (leader is separate)

const HEADERS = [
  'Timestamp',
  'Registration ID',
  'Team Name',
  'Total Team Members',
  'Team Leader Name',
  'Team Leader Roll Number',
  'Enrollment Number',
  'Branch',
  'Year',
  'Semester',
  'Gender',
  'Personal Email',
  'WhatsApp Number',
  // Member 1
  'Member 1 Name',
  'Member 1 Roll Number',
  'Member 1 Enrollment Number',
  'Member 1 Branch',
  'Member 1 Year',
  'Member 1 Semester',
  'Member 1 Gender',
  'Member 1 Email',
  'Member 1 WhatsApp',
  // Member 2
  'Member 2 Name',
  'Member 2 Roll Number',
  'Member 2 Enrollment Number',
  'Member 2 Branch',
  'Member 2 Year',
  'Member 2 Semester',
  'Member 2 Gender',
  'Member 2 Email',
  'Member 2 WhatsApp',
  // Member 3
  'Member 3 Name',
  'Member 3 Roll Number',
  'Member 3 Enrollment Number',
  'Member 3 Branch',
  'Member 3 Year',
  'Member 3 Semester',
  'Member 3 Gender',
  'Member 3 Email',
  'Member 3 WhatsApp',
  // Member 4
  'Member 4 Name',
  'Member 4 Roll Number',
  'Member 4 Enrollment Number',
  'Member 4 Branch',
  'Member 4 Year',
  'Member 4 Semester',
  'Member 4 Gender',
  'Member 4 Email',
  'Member 4 WhatsApp',
  // Member 5
  'Member 5 Name',
  'Member 5 Roll Number',
  'Member 5 Enrollment Number',
  'Member 5 Branch',
  'Member 5 Year',
  'Member 5 Semester',
  'Member 5 Gender',
  'Member 5 Email',
  'Member 5 WhatsApp',
  'Declaration Accepted',
  'Submission Status',
  'Email Status'
];

/* =============================================================================
 * HTTP ENTRY POINTS
 * ============================================================================= */

/**
 * Health check / connectivity test.
 * Also returns which spreadsheet is receiving data (so you can verify the link).
 */
function handleConfirmAction_(param) {
  var regId = String(param.registrationId || param.id || '').trim();
  var statusMsg = String(param.status || '100% Right & Accurate').trim();
  if (regId) {
    var sheet = getOrCreateSheet_();
    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      var ids = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        var curId = String(ids[i][0] || '').trim();
        if (curId.charAt(0) === "'") curId = curId.substring(1);
        if (curId.toLowerCase() === regId.toLowerCase() || curId.replace(/^sih2026-?/i, '') === regId.replace(/^sih2026-?/i, '')) {
          var timeStr = new Date().toLocaleString();
          var writeVal = '[VERIFIED] Status: ' + statusMsg + ' | Confirmed On: ' + timeStr;
          sheet.getRange(i + 2, 60).setValue(writeVal); // Column BH (Col 60) = Confirmation
          return jsonResponse_({ success: true, message: 'Confirmation logged in Column BH (Col 60)', row: i + 2, value: writeVal });
        }
      }
    }
  }
  return jsonResponse_({ success: false, message: 'Registration ID not found for confirmation' });
}

function handleReportAction_(param) {
  var regId = String(param.registrationId || param.id || '').trim();
  var oldVal = String(param.oldVal || param.old_val || '').trim();
  var newVal = String(param.newVal || param.new_val || '').trim();
  var author = String(param.author || param.name || '').trim();
  var contact = String(param.contact || param.phone || '').trim();

  if (regId) {
    var sheet = getOrCreateSheet_();
    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      var ids = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        var curId = String(ids[i][0] || '').trim();
        if (curId.charAt(0) === "'") curId = curId.substring(1);
        if (curId.toLowerCase() === regId.toLowerCase() || curId.replace(/^sih2026-?/i, '') === regId.replace(/^sih2026-?/i, '')) {
          var timeStr = new Date().toLocaleString();
          var authorInfo = author ? author : 'Team Member';
          if (contact) authorInfo += ' (' + contact + ')';
          var reportText = '[CORRECTION REQUEST] Incorrect Detail: "' + oldVal + '" | Requested Update: "' + newVal + '" | Submitted By: ' + authorInfo + ' | Date: ' + timeStr;
          sheet.getRange(i + 2, 59).setValue(reportText); // Column BG (Col 59) = Report
          return jsonResponse_({ success: true, message: 'Report logged in Column BG (Col 59)', row: i + 2, value: reportText });
        }
      }
    }
  }
  return jsonResponse_({ success: false, message: 'Registration ID not found for report' });
}

function handleGetTeamsAction_() {
  var sheet = getOrCreateSheet_();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var teams = [];

  if (lastRow >= 2) {
    var rows = sheet.getRange(2, 1, lastRow - 1, Math.max(58, lastCol)).getValues();
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var regId = String(row[1] || '').trim();
      var tName = String(row[2] || '').trim();
      var timeStr = String(row[0] || '').trim();

      if (tName.charAt(0) === "'") tName = tName.substring(1);
      if (regId.charAt(0) === "'") regId = regId.substring(1);

      if (tName && regId) {
        var teamObj = {
          registrationId: regId,
          teamName: tName,
          timestamp: timeStr,
          teamLeaderName: String(row[4] || '').trim(),
          leaderRollNumber: String(row[5] || '').trim(),
          leaderEnrollment: String(row[6] || '').trim(),
          leaderBranch: String(row[7] || '').trim(),
          leaderYear: String(row[8] || '').trim(),
          leaderSemester: String(row[9] || '').trim(),
          leaderGender: String(row[10] || '').trim(),
          leaderEmail: String(row[11] || '').trim(),
          leaderMobile: String(row[12] || '').trim(),
          teamMembers: []
        };

        // Read up to 5 members from sheet columns
        for (var m = 0; m < 5; m++) {
          var base = 13 + (m * 9);
          var mName = String(row[base] || '').trim();
          if (mName) {
            teamObj.teamMembers.push({
              name: mName,
              rollNumber: String(row[base + 1] || '').trim(),
              enrollment: String(row[base + 2] || '').trim(),
              branch: String(row[base + 3] || '').trim(),
              year: String(row[base + 4] || '').trim(),
              sem: String(row[base + 5] || '').trim(),
              gender: String(row[base + 6] || '').trim(),
              email: String(row[base + 7] || '').trim(),
              mobile: String(row[base + 8] || '').trim()
            });
          }
        }

        teams.push(teamObj);
      }
    }
  }

  return jsonResponse_({
    success: true,
    totalTeams: teams.length,
    teams: teams
  });
}

function doGet(e) {
  try {
    if (e && e.parameter) {
      var act = String(e.parameter.action || '').toLowerCase();
      if (act === 'confirm' || act === 'confirmdata') return handleConfirmAction_(e.parameter);
      if (act === 'report' || act === 'reportcorrection') return handleReportAction_(e.parameter);
      if (act === 'teams' || act === 'getteams' || act === 'verify') return handleGetTeamsAction_();
      if (act === 'submit' || e.parameter.data || e.parameter.teamName) {
        var rawPayload = e.parameter.data || JSON.stringify(e.parameter);
        return handleRegistration_(rawPayload);
      }
    }

    var ss = getSpreadsheet_();
    var sheet = getOrCreateSheet_();
    var lastRow = sheet.getLastRow();
    var lastId = '';
    if (lastRow >= 2) {
      lastId = String(sheet.getRange(lastRow, 2).getValue() || '');
    }

    return jsonResponse_({
      success: true,
      message: 'SIH 2026 Internal Registration API is online.',
      sheetReady: !!sheet,
      sheetName: SHEET_NAME,
      spreadsheetName: ss.getName(),
      spreadsheetId: ss.getId(),
      spreadsheetUrl: ss.getUrl(),
      totalRegistrations: Math.max(0, lastRow - 1),
      lastRegistrationId: lastId
    });
  } catch (err) {
    return jsonResponse_({ success: false, error: err.toString() });
  }
}

/**
 * Accept registration JSON and append a new row.
 * Supports:
 *  - raw JSON body (text/plain or application/json)
 *  - form field "data" with JSON string (application/x-www-form-urlencoded)
 */
function doPost(e) {
  try {
    var raw = '';
    if (e && e.parameter && e.parameter.data) {
      raw = e.parameter.data;
    } else if (e && e.postData && e.postData.contents) {
      raw = e.postData.contents;
    }
    return handleRegistration_(raw);
  } catch (err) {
    console.error('doPost error:', err);
    return jsonResponse_({
      success: false,
      message: 'Unexpected server error. Please try again later.'
    });
  }
}

/**
 * Shared registration handler (used by doPost and doGet backup).
 */
function handleRegistration_(raw) {
  const lock = LockService.getScriptLock();
  try {
    const locked = lock.tryLock(30000);
    if (!locked) {
      return jsonResponse_({
        success: false,
        message: 'Server is busy. Please try again in a moment.'
      });
    }

    if (!raw || String(raw).trim() === '') {
      return jsonResponse_({
        success: false,
        message: 'Empty submission. Request body is required.'
      });
    }

    var payload;
    try {
      payload = JSON.parse(raw);
    } catch (parseErr) {
      return jsonResponse_({
        success: false,
        message: 'Invalid JSON payload.'
      });
    }

    const data = normalizePayload_(payload);
    const validation = validateRegistration_(data);
    if (!validation.ok) {
      return jsonResponse_({
        success: false,
        message: validation.message || 'Required fields are missing.'
      });
    }

    const sheet = getOrCreateSheet_();
    ensureHeaders_(sheet);

    const registrationId = generateRegistrationId_(sheet);
    const timestamp = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone() || 'Asia/Kolkata',
      'yyyy-MM-dd HH:mm:ss'
    );

    const row = buildRow_(data, registrationId, timestamp);
    sheet.appendRow(row);
    SpreadsheetApp.flush();

    var emailResult = sendLeaderConfirmationEmail_(data, registrationId, timestamp);

    // Write email result into the last column of the row just added with RED/GREEN highlights
    try {
      var lastRow = sheet.getLastRow();
      var emailCol = HEADERS.length; // Email Status
      var emailCell = sheet.getRange(lastRow, emailCol);
      if (emailResult.sent) {
        emailCell.setValue('Sent to ' + cleanEmailAddress_(data.leader.email) + ' (Quota left: ' + emailResult.quota + ')');
        emailCell.setBackground('#e6f4ea'); // Light Green
        emailCell.setFontColor('#137333');  // Dark Green text
        emailCell.setFontWeight('bold');
      } else {
        emailCell.setValue('FAILED: ' + (emailResult.message || 'unknown'));
        emailCell.setBackground('#fce8e6'); // RED alert background
        emailCell.setFontColor('#c5221f');  // Bold Red text
        emailCell.setFontWeight('bold');
      }
      SpreadsheetApp.flush();
    } catch (sheetEmailErr) {
      console.error('Could not write Email Status column:', sheetEmailErr);
    }

    try {
      CacheService.getScriptCache().remove('teams_json_v1');
    } catch (cacheClearErr) {
      // ignore
    }

    return jsonResponse_({
      success: true,
      registrationId: registrationId,
      timestamp: timestamp,
      message: emailResult.sent
        ? 'Registration submitted successfully. Confirmation email sent to Team Leader.'
        : 'Registration submitted successfully, but confirmation email failed: ' + (emailResult.message || 'unknown error'),
      emailSent: emailResult.sent,
      emailTo: cleanEmailAddress_(data.leader.email),
      emailMessage: emailResult.message || '',
      emailQuota: emailResult.quota,
      spreadsheetUrl: getSpreadsheet_().getUrl()
    });
  } catch (err) {
    console.error('handleRegistration_ error:', err);
    return jsonResponse_({
      success: false,
      message: 'Unexpected server error: ' + String(err.message || err)
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (ignore) {
      // ignore
    }
  }
}

/* =============================================================================
 * CONFIRMATION EMAIL (Team Leader)
 * ============================================================================= */

/**
 * RUN THIS ONCE in the Apps Script editor before expecting emails to work:
 * 1. Select function: authorizeMailPermissions
 * 2. Click Run
 * 3. Review permissions → Allow (Gmail/Mail access)
 * 4. Check your inbox for "SIH 2026 Mail Test OK"
 * 5. Then Deploy → Manage deployments → Edit → New version → Deploy
 */
function authorizeMailPermissions() {
  var quota = MailApp.getRemainingDailyQuota();
  Logger.log('Mail quota remaining: ' + quota);

  var me = Session.getActiveUser().getEmail();
  if (!me) {
    throw new Error('Could not detect your Google account email. Sign in and try again.');
  }

  MailApp.sendEmail(
    me,
    'SIH 2026 Mail Test OK',
    'Mail permission is working for the SIH 2026 registration script.\n\nQuota remaining: ' +
      quota +
      '\n\nYou can now redeploy the Web App (New version).'
  );

  Logger.log('Test email sent to: ' + me);
  return 'OK — test email sent to ' + me + '. Quota left: ' + quota;
}

/**
 * ADMIN UTILITY: Resend confirmation emails for all failed rows in the Google Sheet.
 * Run this function from the Apps Script editor dropdown when your daily email quota resets!
 */
function resendFailedEmails() {
  var sheet = getOrCreateSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    Logger.log('No registration rows found.');
    return 'No registrations found.';
  }

  var data = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  var sentCount = 0;
  var failCount = 0;

  for (var i = 0; i < data.length; i++) {
    var rowIndex = i + 2;
    var row = data[i];
    var status = String(row[HEADERS.length - 1] || '');

    // Process only rows where Email Status starts with "FAILED" or is empty
    if (status.indexOf('FAILED') === 0 || !status) {
      var regId = String(row[1] || '');
      var timestamp = String(row[0] || '');
      var leaderEmail = cleanEmailAddress_(row[11]);
      var leaderName = String(row[4] || '');
      var teamName = String(row[2] || '');
      var teamSize = parseInt(row[3] || 6, 10);

      if (!leaderEmail || !isValidEmail_(leaderEmail)) {
        continue;
      }

      var payloadObj = {
        teamName: teamName,
        teamSize: teamSize,
        leader: {
          fullName: leaderName,
          rollNumber: String(row[5] || ''),
          collegeId: String(row[6] || ''),
          branch: String(row[7] || ''),
          year: String(row[8] || ''),
          semester: String(row[9] || ''),
          gender: String(row[10] || ''),
          email: leaderEmail,
          whatsapp: String(row[12] || '')
        },
        members: [],
        declarations: { truth: true, internal: true, contact: true }
      };

      // Reconstruct members 1..5
      for (var m = 1; m <= 5; m++) {
        var baseIdx = 13 + (m - 1) * 9;
        if (row[baseIdx]) {
          payloadObj.members.push({
            fullName: String(row[baseIdx] || ''),
            rollNumber: String(row[baseIdx + 1] || ''),
            collegeId: String(row[baseIdx + 2] || ''),
            branch: String(row[baseIdx + 3] || ''),
            year: String(row[baseIdx + 4] || ''),
            semester: String(row[baseIdx + 5] || ''),
            gender: String(row[baseIdx + 6] || ''),
            email: cleanEmailAddress_(row[baseIdx + 7]),
            whatsapp: String(row[baseIdx + 8] || '')
          });
        }
      }

      var res = sendLeaderConfirmationEmail_(payloadObj, regId, timestamp);
      var cell = sheet.getRange(rowIndex, HEADERS.length);
      if (res.sent) {
        cell.setValue('Sent to ' + leaderEmail + ' (Quota left: ' + res.quota + ')');
        cell.setBackground('#e6f4ea'); // Light green
        cell.setFontColor('#137333');
        cell.setFontWeight('bold');
        sentCount++;
      } else {
        cell.setValue('FAILED: ' + (res.message || 'unknown'));
        cell.setBackground('#fce8e6'); // Red alert
        cell.setFontColor('#c5221f');
        cell.setFontWeight('bold');
        failCount++;
        if (res.quota === 0) {
          Logger.log('Quota exhausted again while resending. Stopped.');
          break;
        }
      }
    }
  }

  var msg = 'Bulk resend complete. Sent: ' + sentCount + ', Remaining Failed: ' + failCount;
  Logger.log(msg);
  return msg;
}

/**
 * ONE-TIME ADMIN UTILITY: Send confirmation emails for real teams SIH2026-0019 and SIH2026-0021
 * and send a copy to the admin email (gkmwin563@gmail.com).
 * Select "sendPendingRealTeamsEmails" in Apps Script dropdown and click Run!
 */
function sendPendingRealTeamsEmails() {
  var targetIds = ['SIH2026-0019', 'SIH2026-0021'];
  var adminEmail = 'gkmwin563@gmail.com';

  var sheet = getOrCreateSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return 'No rows found in sheet.';

  var data = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  var results = [];

  for (var i = 0; i < data.length; i++) {
    var rowIndex = i + 2;
    var row = data[i];
    var regId = String(row[1] || '').trim();

    if (targetIds.indexOf(regId) !== -1) {
      var timestamp = String(row[0] || '');
      var leaderEmail = cleanEmailAddress_(row[11]);
      var leaderName = String(row[4] || '');
      var teamName = String(row[2] || '');
      var teamSize = parseInt(row[3] || 6, 10);

      var payloadObj = {
        teamName: teamName,
        teamSize: teamSize,
        leader: {
          fullName: leaderName,
          rollNumber: String(row[5] || ''),
          collegeId: String(row[6] || ''),
          branch: String(row[7] || ''),
          year: String(row[8] || ''),
          semester: String(row[9] || ''),
          gender: String(row[10] || ''),
          email: leaderEmail,
          whatsapp: String(row[12] || '')
        },
        members: [],
        declarations: { truth: true, internal: true, contact: true }
      };

      // Reconstruct members 1..5
      for (var m = 1; m <= 5; m++) {
        var baseIdx = 13 + (m - 1) * 9;
        if (row[baseIdx]) {
          payloadObj.members.push({
            fullName: String(row[baseIdx] || ''),
            rollNumber: String(row[baseIdx + 1] || ''),
            collegeId: String(row[baseIdx + 2] || ''),
            branch: String(row[baseIdx + 3] || ''),
            year: String(row[baseIdx + 4] || ''),
            semester: String(row[baseIdx + 5] || ''),
            gender: String(row[baseIdx + 6] || ''),
            email: cleanEmailAddress_(row[baseIdx + 7]),
            whatsapp: String(row[baseIdx + 8] || '')
          });
        }
      }

      // 1. Send confirmation email to Team Leader
      var res = sendLeaderConfirmationEmail_(payloadObj, regId, timestamp);

      // 2. Send a copy to Admin Email (gkmwin563@gmail.com) so Admin gets confirmed
      try {
        var adminSubject = '[COPY] ' + regId + ' Confirmation Email - ' + teamName;
        var htmlBody = buildConfirmationEmailHtml_(payloadObj, regId, timestamp);
        var plainBody = buildConfirmationEmailText_(payloadObj, regId, timestamp);
        MailApp.sendEmail(adminEmail, adminSubject, plainBody, { htmlBody: htmlBody, name: 'SIH 2026 Registration Copy' });
      } catch (adminErr) {
        Logger.log('Could not send copy to admin: ' + adminErr);
      }

      // 3. Update Sheet status to Green
      var cell = sheet.getRange(rowIndex, HEADERS.length);
      if (res.sent) {
        cell.setValue('Sent to ' + leaderEmail + ' (+Copy to Admin)');
        cell.setBackground('#e6f4ea'); // Light green
        cell.setFontColor('#137333');
        cell.setFontWeight('bold');
        results.push(regId + ': Sent successfully to ' + leaderEmail + ' and Admin copy sent to ' + adminEmail);
      } else {
        cell.setValue('FAILED: ' + (res.message || 'unknown'));
        cell.setBackground('#fce8e6'); // Red alert
        cell.setFontColor('#c5221f');
        cell.setFontWeight('bold');
        results.push(regId + ': Failed - ' + res.message);
      }
    }
  }

  var msg = results.join('\n');
  Logger.log(msg);
  return msg;
}

/**
 * Send a full registration confirmation email to the Team Leader.
 * Registration still succeeds even if email fails.
 */
function sendLeaderConfirmationEmail_(data, registrationId, timestamp) {
  var quota = -1;
  try {
    quota = MailApp.getRemainingDailyQuota();
  } catch (quotaErr) {
    return {
      sent: false,
      quota: -1,
      message:
        'Mail permission not granted. In Apps Script, run authorizeMailPermissions once and Allow access, then redeploy (New version).'
    };
  }

  if (quota === 0) {
    return {
      sent: false,
      quota: 0,
      message: 'Daily email quota exhausted for this Google account. Try again tomorrow.'
    };
  }

  try {
    var to = cleanEmailAddress_(data.leader && data.leader.email);
    if (!to || !isValidEmail_(to)) {
      return { sent: false, quota: quota, message: 'Team Leader email missing or invalid: ' + to };
    }

    var subject =
      'SIH 2026 Internal Registration Confirmed - ' +
      registrationId +
      ' - ' +
      String(data.teamName || 'Team').replace(/[^\w\s\-_.]/g, ' ');

    var html = buildConfirmationEmailHtml_(data, registrationId, timestamp);
    var plain = buildConfirmationEmailText_(data, registrationId, timestamp);

    // Primary: MailApp (works for consumer + Workspace when authorized)
    try {
      MailApp.sendEmail(to, subject, plain, {
        htmlBody: html,
        name: 'UIT SIH 2026 Registration'
      });
    } catch (mailErr) {
      // Fallback: GmailApp (needs Gmail scope; helps on some accounts)
      console.error('MailApp failed, trying GmailApp:', mailErr);
      GmailApp.sendEmail(to, subject, plain, {
        htmlBody: html,
        name: 'UIT SIH 2026 Registration'
      });
    }

    return {
      sent: true,
      quota: quota - 1,
      message: 'Confirmation email sent to ' + to
    };
  } catch (err) {
    console.error('sendLeaderConfirmationEmail_ error:', err);
    var msg = String(err.message || err);
    if (/Authorization|permission|access|scope/i.test(msg)) {
      msg =
        'Mail permission missing. Run authorizeMailPermissions in Apps Script editor, click Allow, then Deploy → New version.';
    }
    return {
      sent: false,
      quota: quota,
      message: msg
    };
  }
}

/** Strip sheet formula-injection quotes and normalize email for sending */
function cleanEmailAddress_(email) {
  var s = String(email == null ? '' : email).trim().toLowerCase();
  while (s.charAt(0) === "'") {
    s = s.substring(1);
  }
  return s;
}

function escapeEmail_(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function personEmailBlockHtml_(title, person) {
  if (!person) return '';
  return (
    '<h3 style="margin:18px 0 8px;color:#1a73e8;font-size:15px;border-bottom:1px solid #e8eaed;padding-bottom:6px;">' +
    escapeEmail_(title) +
    '</h3>' +
    '<table style="width:100%;border-collapse:collapse;font-size:13px;color:#202124;">' +
    emailRow_('Full Name', person.fullName) +
    emailRow_('Roll Number', person.rollNumber) +
    emailRow_('Enrollment Number', person.collegeId) +
    emailRow_('Branch', person.branch) +
    emailRow_('Year / Semester', (person.year || '—') + ' / ' + (person.semester || '—')) +
    emailRow_('Gender', person.gender) +
    emailRow_('Email', person.email) +
    emailRow_('WhatsApp', person.whatsapp) +
    '</table>'
  );
}

function emailRow_(label, value) {
  return (
    '<tr>' +
    '<td style="padding:4px 8px 4px 0;color:#5f6368;width:38%;vertical-align:top;">' +
    escapeEmail_(label) +
    '</td>' +
    '<td style="padding:4px 0;font-weight:600;vertical-align:top;">' +
    escapeEmail_(value || '—') +
    '</td>' +
    '</tr>'
  );
}

function buildConfirmationEmailHtml_(data, registrationId, timestamp) {
  var membersHtml = '';
  for (var i = 0; i < data.members.length; i++) {
    membersHtml += personEmailBlockHtml_('Team Member ' + (i + 1), data.members[i]);
  }

  return (
    '<div style="font-family:Segoe UI,Roboto,Arial,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dadce0;border-radius:10px;overflow:hidden;">' +
    '<div style="background:#1a73e8;color:#fff;padding:16px 20px;">' +
    '<div style="font-size:13px;opacity:.9;">United Institute of Technology, Naini, Prayagraj</div>' +
    '<div style="font-size:20px;font-weight:700;margin-top:4px;">SIH 2026 Internal Registration</div>' +
    '</div>' +
    '<div style="padding:20px;">' +
    '<p style="margin:0 0 12px;font-size:15px;color:#188038;font-weight:700;">Registration Submitted Successfully</p>' +
    '<p style="margin:0 0 14px;font-size:14px;color:#202124;">Dear ' +
    escapeEmail_(data.leader.fullName) +
    ',</p>' +
    '<p style="margin:0 0 14px;font-size:14px;color:#5f6368;line-height:1.5;">' +
    'Thank you for registering your team for the Smart India Hackathon (SIH) 2026 Internal Registration Portal. ' +
    'Your response has been recorded successfully. Please find your registration details below.' +
    '</p>' +
    '<div style="background:#f8f9fa;border:1px solid #e8eaed;border-radius:8px;padding:12px 14px;margin-bottom:16px;">' +
    '<table style="width:100%;border-collapse:collapse;font-size:13px;">' +
    emailRow_('Registration ID', registrationId) +
    emailRow_('Submitted On', timestamp) +
    emailRow_('Team Name', data.teamName) +
    emailRow_('Total Members', data.teamSize) +
    '</table>' +
    '</div>' +
    personEmailBlockHtml_('Team Leader', data.leader) +
    membersHtml +
    '<div style="margin-top:18px;padding:14px 16px;background:#e7fce9;border:1px solid #25d366;border-radius:8px;font-size:13px;color:#075e54;line-height:1.5;">' +
    '<p style="margin:0 0 8px;font-weight:700;font-size:14px;color:#128c7e;">' +
    '📢 For all official announcements and updates, join the SIH 2026 Official WhatsApp Group:' +
    '</p>' +
    '<p style="margin:0 0 6px;">' +
    '<a href="https://chat.whatsapp.com/GrZQAnzbHEJ7nKTXsOUzYR?s=cl&amp;p=a&amp;ilr=0" target="_blank" style="display:inline-block;background:#25d366;color:#ffffff;text-decoration:none;font-weight:700;padding:8px 14px;border-radius:6px;font-size:13px;">' +
    '👉 Join SIH 2026 Official WhatsApp Group' +
    '</a>' +
    '</p>' +
    '<p style="margin:0;font-size:11px;color:#075e54;">' +
    'https://chat.whatsapp.com/GrZQAnzbHEJ7nKTXsOUzYR?s=cl&amp;p=a&amp;ilr=0' +
    '</p>' +
    '</div>' +
    '<div style="margin-top:14px;padding:12px 14px;background:#e8f0fe;border-radius:8px;font-size:12px;color:#1557b0;line-height:1.5;">' +
    '<strong>Important:</strong> This is only Internal Registration and does not guarantee selection or official SIH registration. ' +
    'Further updates will be shared on your registered Email ID and WhatsApp number.' +
    '</div>' +
    '<p style="margin:18px 0 0;font-size:12px;color:#5f6368;">' +
    'United Institute of Technology · Smart India Hackathon (SIH) 2026 Internal Registration Portal' +
    '</p>' +
    '</div></div>'
  );
}

function buildConfirmationEmailText_(data, registrationId, timestamp) {
  var lines = [];
  lines.push('SIH 2026 INTERNAL REGISTRATION CONFIRMATION');
  lines.push('United Institute of Technology, Naini, Prayagraj');
  lines.push('');
  lines.push('Registration Submitted Successfully');
  lines.push('');
  lines.push('Registration ID : ' + registrationId);
  lines.push('Submitted On    : ' + timestamp);
  lines.push('Team Name       : ' + (data.teamName || ''));
  lines.push('Total Members   : ' + data.teamSize);
  lines.push('');
  lines.push('TEAM LEADER');
  lines.push('Name       : ' + (data.leader.fullName || ''));
  lines.push('Roll       : ' + (data.leader.rollNumber || ''));
  lines.push('Enrollment : ' + (data.leader.collegeId || ''));
  lines.push('Branch     : ' + (data.leader.branch || ''));
  lines.push('Year/Sem   : ' + (data.leader.year || '') + ' / ' + (data.leader.semester || ''));
  lines.push('Gender     : ' + (data.leader.gender || ''));
  lines.push('Email      : ' + (data.leader.email || ''));
  lines.push('WhatsApp   : ' + (data.leader.whatsapp || ''));
  lines.push('');

  for (var i = 0; i < data.members.length; i++) {
    var m = data.members[i];
    lines.push('TEAM MEMBER ' + (i + 1));
    lines.push('Name       : ' + (m.fullName || ''));
    lines.push('Roll       : ' + (m.rollNumber || ''));
    lines.push('Enrollment : ' + (m.collegeId || ''));
    lines.push('Branch     : ' + (m.branch || ''));
    lines.push('Year/Sem   : ' + (m.year || '') + ' / ' + (m.semester || ''));
    lines.push('Gender     : ' + (m.gender || ''));
    lines.push('Email      : ' + (m.email || ''));
    lines.push('WhatsApp   : ' + (m.whatsapp || ''));
    lines.push('');
  }

  lines.push('📢 For all official announcements and updates, join the SIH 2026 Official WhatsApp Group:');
  lines.push('https://chat.whatsapp.com/GrZQAnzbHEJ7nKTXsOUzYR?s=cl&p=a&ilr=0');
  lines.push('');
  lines.push('NOTE: This is Internal Registration only and does not guarantee selection.');
  lines.push('United Institute of Technology · SIH 2026 Internal Registration Portal');
  return lines.join('\n');
}

/* =============================================================================
 * SHEET HELPERS
 * ============================================================================= */

function getSpreadsheet_() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) {
    throw new Error(
      'No spreadsheet bound. Open Apps Script from the sheet, or set SPREADSHEET_ID in Code.gs.'
    );
  }
  return active;
}

function getOrCreateSheet_() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  const existing = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const needsHeaders =
    sheet.getLastRow() === 0 ||
    !existing[0] ||
    String(existing[0]).trim() === '' ||
    String(existing[1]).trim() !== 'Registration ID';

  if (needsHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#e8f0fe');
    sheet.setFrozenRows(1);
    return;
  }

  // Upgrade existing sheet: add Email Status header if missing
  var lastHeader = String(existing[HEADERS.length - 1] || '').trim();
  if (lastHeader !== 'Email Status') {
    sheet.getRange(1, HEADERS.length).setValue('Email Status');
    sheet.getRange(1, HEADERS.length).setFontWeight('bold').setBackground('#e8f0fe');
  }
}

/**
 * Generate next unique ID: SIH2026-0001, SIH2026-0002, ...
 * Scans the Registration ID column and takes max + 1 (safe with deletes/gaps).
 */
function generateRegistrationId_(sheet) {
  const lastRow = sheet.getLastRow();
  let maxNum = 0;

  if (lastRow >= 2) {
    const ids = sheet.getRange(2, 2, lastRow - 1 + 1, 1).getValues(); // column B
    for (var i = 0; i < ids.length; i++) {
      var id = String(ids[i][0] || '').trim();
      var match = /^SIH2026-(\d+)$/i.exec(id);
      if (match) {
        var n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
  }

  var next = maxNum + 1;
  var candidate = REG_ID_PREFIX + pad4_(next);

  // Extra safety: never reuse an existing ID
  while (registrationIdExists_(sheet, candidate)) {
    next += 1;
    candidate = REG_ID_PREFIX + pad4_(next);
  }

  return candidate;
}

function registrationIdExists_(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const ids = sheet.getRange(2, 2, lastRow - 1 + 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === id) return true;
  }
  return false;
}

function isTeamNameTaken_(sheet, teamName) {
  if (!teamName || !sheet) return false;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  var target = String(teamName).trim().toLowerCase();
  while (target.charAt(0) === "'") target = target.substring(1);

  // Column C contains Team Names
  var names = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
  for (var i = 0; i < names.length; i++) {
    var existing = String(names[i][0] || '').trim().toLowerCase();
    while (existing.charAt(0) === "'") existing = existing.substring(1);
    if (existing && existing === target) {
      return true;
    }
  }
  return false;
}

function pad4_(n) {
  var s = String(n);
  while (s.length < 4) s = '0' + s;
  return s;
}

/* =============================================================================
 * VALIDATION & SANITIZATION
 * ============================================================================= */

function normalizePayload_(payload) {
  var src = payload && payload.fields ? payload.fields : payload;
  src = src || {};

  var teamSize = parseInt(src.teamSize || payload.teamSize || 0, 10);

  var data = {
    teamName: sanitize_(src.teamName),
    teamSize: teamSize,
    leader: {
      fullName: sanitize_(src.leader_fullName),
      rollNumber: sanitize_(src.leader_rollNumber),
      collegeId: sanitize_(src.leader_collegeId),
      branch: sanitize_(src.leader_branch),
      year: sanitize_(src.leader_year),
      semester: sanitize_(String(src.leader_semester || '')),
      gender: sanitize_(src.leader_gender),
      email: cleanEmailAddress_(sanitize_(src.leader_email)),
      whatsapp: normalizePhone_(src.leader_whatsapp)
    },
    members: [],
    declarations: {
      truth: !!src.declare_truth,
      internal: !!src.declare_internal,
      contact: !!src.declare_contact
    }
  };

  // Members 1..(teamSize-1)
  var memberCount = Math.max(0, Math.min(MAX_MEMBERS, teamSize - 1));
  for (var i = 1; i <= memberCount; i++) {
    data.members.push({
      fullName: sanitize_(src['member' + i + '_fullName']),
      rollNumber: sanitize_(src['member' + i + '_rollNumber']),
      collegeId: sanitize_(src['member' + i + '_collegeId']),
      branch: sanitize_(src['member' + i + '_branch']),
      year: sanitize_(src['member' + i + '_year']),
      semester: sanitize_(String(src['member' + i + '_semester'] || '')),
      gender: sanitize_(src['member' + i + '_gender']),
      email: cleanEmailAddress_(sanitize_(src['member' + i + '_email'])),
      whatsapp: normalizePhone_(src['member' + i + '_whatsapp'])
    });
  }

  return data;
}

function validateRegistration_(data) {
  if (!data || typeof data !== 'object') {
    return { ok: false, message: 'Required fields are missing.' };
  }

  // Honeypot anti-bot check
  if (data.hp_website && String(data.hp_website).trim().length > 0) {
    return { ok: false, message: 'Automated spam submission detected.' };
  }

  if (!data.teamName) {
    return { ok: false, message: 'Team name is required.' };
  }

  // Check SIH Rule: Must not contain institute name (with Unicode homoglyph normalization)
  var rawName = String(data.teamName || '').toLowerCase();
  var normalizedName = normalizeHomoglyphs_(rawName).toLowerCase();
  if (
    normalizedName.includes('uit') ||
    normalizedName.includes('united') ||
    rawName.includes('uit') ||
    rawName.includes('united')
  ) {
    return {
      ok: false,
      message: 'SIH Rule Violation: Team name must not contain the name of your institute ("United" / "UIT") in any form.'
    };
  }

  // Check duplicate team name in sheet
  try {
    const sheet = getOrCreateSheet_();
    if (isTeamNameTaken_(sheet, data.teamName)) {
      return {
        ok: false,
        message: 'The team name "' + data.teamName + '" is already registered. Please choose a unique team name.'
      };
    }

    // Check duplicate Leader Roll Number or Leader Email in sheet
    var leaderRegCheck = isLeaderOrRollAlreadyRegistered_(sheet, data.leader.rollNumber, data.leader.email);
    if (leaderRegCheck.registered) {
      return {
        ok: false,
        message: 'Registration blocked: ' + leaderRegCheck.reason
      };
    }
  } catch (ignore) {
    // continue
  }

  if (data.teamSize !== 6) {
    return { ok: false, message: 'SIH 2026 mandates a team size of exactly 6 members (1 Team Leader + 5 Members).' };
  }

  var leaderCheck = validatePerson_(data.leader, 'Team Leader');
  if (!leaderCheck.ok) return leaderCheck;

  var expectedMembers = 5;
  if (data.members.length !== expectedMembers) {
    return {
      ok: false,
      message: 'Please provide details for all 5 team members.'
    };
  }

  for (var i = 0; i < data.members.length; i++) {
    var mCheck = validatePerson_(data.members[i], 'Member ' + (i + 1));
    if (!mCheck.ok) return mCheck;
  }

  var hasFemale = data.leader.gender === 'Female';
  for (var j = 0; j < data.members.length; j++) {
    if (data.members[j].gender === 'Female') {
      hasFemale = true;
      break;
    }
  }
  if (!hasFemale) {
    return {
      ok: false,
      message: 'Each team must include at least one female member.'
    };
  }

  if (!data.declarations.truth || !data.declarations.internal || !data.declarations.contact) {
    return { ok: false, message: 'All declarations must be accepted.' };
  }

  return { ok: true };
}

function validatePerson_(person, label) {
  if (!person) return { ok: false, message: label + ' details are missing.' };

  if (!person.fullName) return { ok: false, message: label + ' name is required.' };
  if (!person.rollNumber) return { ok: false, message: label + ' roll number is required.' };
  if (!person.collegeId) return { ok: false, message: label + ' enrollment number is required.' };
  if (!person.branch) return { ok: false, message: label + ' branch is required.' };
  if (!person.year) return { ok: false, message: label + ' year is required.' };
  if (!person.semester) return { ok: false, message: label + ' semester is required.' };
  if (!person.gender) return { ok: false, message: label + ' gender is required.' };

  var ysCheck = validateYearSemesterMatch_(person.year, person.semester, label);
  if (!ysCheck.ok) return ysCheck;

  if (!isValidStrictEmail_(person.email)) {
    return { ok: false, message: label + ' email address is invalid or unverified.' };
  }
  if (!isValidPhone_(person.whatsapp)) {
    return { ok: false, message: label + ' WhatsApp number is invalid.' };
  }

  return { ok: true };
}

function validateYearSemesterMatch_(year, semester, label) {
  var y = String(year || '').trim();
  var sem = parseInt(semester || '0', 10);

  if (y === 'First Year' && sem !== 1 && sem !== 2) {
    return { ok: false, message: label + ': First Year students can only be in Semester 1 or 2.' };
  }
  if (y === 'Second Year' && sem !== 3 && sem !== 4) {
    return { ok: false, message: label + ': Second Year students can only be in Semester 3 or 4.' };
  }
  if (y === 'Third Year' && sem !== 5 && sem !== 6) {
    return { ok: false, message: label + ': Third Year students can only be in Semester 5 or 6.' };
  }
  if (y === 'Fourth Year' && sem !== 7 && sem !== 8) {
    return { ok: false, message: label + ': Fourth Year students can only be in Semester 7 or 8.' };
  }

  return { ok: true };
}

function isLeaderOrRollAlreadyRegistered_(sheet, rollNumber, email) {
  if (!sheet) return { registered: false };
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { registered: false };

  var targetRoll = String(rollNumber || '').trim().toUpperCase();
  var targetEmail = String(email || '').trim().toLowerCase();
  while (targetRoll.charAt(0) === "'") targetRoll = targetRoll.substring(1);
  while (targetEmail.charAt(0) === "'") targetEmail = targetEmail.substring(1);

  if (!targetRoll && !targetEmail) return { registered: false };

  var data = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var regId = String(row[1] || '').trim();
    var existingRoll = String(row[5] || '').trim().toUpperCase();
    var existingEmail = String(row[11] || '').trim().toLowerCase();

    while (existingRoll.charAt(0) === "'") existingRoll = existingRoll.substring(1);
    while (existingEmail.charAt(0) === "'") existingEmail = existingEmail.substring(1);

    if (targetRoll && existingRoll && targetRoll === existingRoll) {
      return { registered: true, reason: 'Roll Number "' + targetRoll + '" is already registered under ' + regId + '.' };
    }
    if (targetEmail && existingEmail && targetEmail === existingEmail) {
      return { registered: true, reason: 'Email "' + targetEmail + '" is already registered under ' + regId + '.' };
    }
  }

  return { registered: false };
}

function isValidStrictEmail_(email) {
  var s = String(email || '').trim().toLowerCase();
  while (s.charAt(0) === "'") s = s.substring(1);

  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(s)) {
    return false;
  }

  // Reject image/file extensions or fake domains
  if (/\.(png|jpg|jpeg|gif|webp|svg|pdf|html|php|js|css|exe|zip|rar|ci|ck|ok)$/i.test(s)) {
    return false;
  }

  var parts = s.split('@');
  if (parts.length !== 2) return false;
  var user = parts[0];
  var domain = parts[1];

  if (user.length < 2 || domain.length < 3) return false;

  var domainParts = domain.split('.');
  var tld = domainParts[domainParts.length - 1];
  if (!/^(com|in|org|edu|net|io|co|gov|ac|info|tech|me|app)$/i.test(tld)) {
    return false;
  }

  return true;
}

function normalizeHomoglyphs_(str) {
  if (!str) return '';
  var s = String(str).trim();
  try {
    s = s.normalize('NFKD');
  } catch (ignore) {}

  s = s.replace(/[\u0410-\u044F]/g, function(c) {
    var map = {'А':'A','а':'a','В':'B','Е':'E','е':'e','К':'K','М':'M','Н':'H','О':'O','о':'o','Р':'P','р':'p','С':'C','с':'c','Т':'T','т':'t','Х':'X','х':'x','І':'I','і':'i'};
    return map[c] || c;
  });

  return s.replace(/[^\x00-\x7F]/g, '');
}

function sanitize_(value) {
  if (value === null || value === undefined) return '';
  var s = String(value)
    .replace(/[\u0000-\u001F\u007F]/g, '') // control chars
    .replace(/^\s+|\s+$/g, '');
  // Prevent formula injection in Sheets
  if (/^[=+\-@]/.test(s)) {
    s = "'" + s;
  }
  // Cap length
  if (s.length > 500) s = s.substring(0, 500);
  return s;
}

function normalizePhone_(value) {
  var digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.indexOf('91') === 0) {
    digits = digits.substring(2);
  }
  return digits;
}

function isValidEmail_(email) {
  return isValidStrictEmail_(email);
}

function isValidPhone_(phone) {
  return /^[6-9]\d{9}$/.test(String(phone || ''));
}

/* =============================================================================
 * ROW BUILDING
 * ============================================================================= */

function buildRow_(data, registrationId, timestamp) {
  var row = [
    timestamp,
    registrationId,
    data.teamName,
    data.teamSize,
    data.leader.fullName,
    data.leader.rollNumber,
    data.leader.collegeId,
    data.leader.branch,
    data.leader.year,
    data.leader.semester,
    data.leader.gender,
    data.leader.email,
    data.leader.whatsapp
  ];

  // Always write 5 member slots; unused remain blank
  for (var i = 0; i < MAX_MEMBERS; i++) {
    var m = data.members[i];
    if (m) {
      row.push(
        m.fullName,
        m.rollNumber,
        m.collegeId,
        m.branch,
        m.year,
        m.semester,
        m.gender,
        m.email,
        m.whatsapp
      );
    } else {
      row.push('', '', '', '', '', '', '', '', '');
    }
  }

  var declarationAccepted =
    data.declarations.truth && data.declarations.internal && data.declarations.contact
      ? 'Yes'
      : 'No';

  row.push(declarationAccepted, 'Submitted', 'Pending');
  return row;
}

/* =============================================================================
 * RESPONSE HELPER
 * ============================================================================= */

/**
 * JSON response. Apps Script Web Apps allow cross-origin reads when deployed
 * as "Anyone". Clients should use Content-Type: text/plain to avoid OPTIONS
 * preflight (which GAS does not implement).
 */
function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Manual test from the Apps Script editor:
 * Run testSubmit_() and check Executions + the Registrations sheet.
 */
function testSubmit_() {
  var sample = {
    teamName: 'Test Team Alpha',
    teamSize: 6,
    leader_fullName: 'Test Leader',
    leader_rollNumber: '21CSE001',
    leader_collegeId: 'ENR001',
    leader_branch: 'CSE',
    leader_year: 'Third Year',
    leader_semester: '5',
    leader_gender: 'Male',
    leader_email: 'leader@example.com',
    leader_whatsapp: '9876543210',
    member1_fullName: 'Test Member 1',
    member1_rollNumber: '21CSE002',
    member1_collegeId: 'ENR002',
    member1_branch: 'CSE',
    member1_year: 'Third Year',
    member1_semester: '5',
    member1_gender: 'Female',
    member1_email: 'm1@example.com',
    member1_whatsapp: '9876543211',
    member2_fullName: 'Test Member 2',
    member2_rollNumber: '21CSE003',
    member2_collegeId: 'ENR003',
    member2_branch: 'CSE',
    member2_year: 'Third Year',
    member2_semester: '5',
    member2_gender: 'Male',
    member2_email: 'm2@example.com',
    member2_whatsapp: '9876543212',
    member3_fullName: 'Test Member 3',
    member3_rollNumber: '21CSE004',
    member3_collegeId: 'ENR004',
    member3_branch: 'ECE',
    member3_year: 'Third Year',
    member3_semester: '5',
    member3_gender: 'Male',
    member3_email: 'm3@example.com',
    member3_whatsapp: '9876543213',
    member4_fullName: 'Test Member 4',
    member4_rollNumber: '21CSE005',
    member4_collegeId: 'ENR005',
    member4_branch: 'CSE (AI & ML)',
    member4_year: 'Third Year',
    member4_semester: '5',
    member4_gender: 'Male',
    member4_email: 'm4@example.com',
    member4_whatsapp: '9876543214',
    member5_fullName: 'Test Member 5',
    member5_rollNumber: '21CSE006',
    member5_collegeId: 'ENR006',
    member5_branch: 'CSE (Data Science)',
    member5_year: 'Third Year',
    member5_semester: '5',
    member5_gender: 'Male',
    member5_email: 'm5@example.com',
    member5_whatsapp: '9876543215',
    declare_truth: true,
    declare_internal: true,
    declare_contact: true
  };
  var res = handleRegistration_(JSON.stringify(sample));
  Logger.log(res.getContent());
}

/**
 * ADMIN UTILITY: Identify and clean up spam rows in the Google Sheet.
 * How to run:
 * 1. Open Apps Script Editor
 * 2. Select function: cleanSpamRows
 * 3. Click Run
 */
function cleanSpamRows() {
  var sheet = getOrCreateSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return 'No rows to clean.';

  var data = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  var deletedCount = 0;

  for (var i = data.length - 1; i >= 0; i--) {
    var rowIndex = i + 2;
    var row = data[i];
    var leaderEmail = String(row[11] || '').trim().toLowerCase();
    var leaderName = String(row[4] || '').trim().toLowerCase();
    var teamName = String(row[2] || '').trim().toLowerCase();

    var isSpam = false;

    // Detect fake email extensions or single letter emails
    if (/\.(png|jpg|jpeg|gif|ci|ck|ok)$/i.test(leaderEmail) || leaderEmail === 'a@a.png' || leaderEmail.length < 6) {
      isSpam = true;
    }

    // Detect fake team name "UIT" and fake leader name "UIT"
    if (teamName === 'uit' && leaderName === 'uit') {
      isSpam = true;
    }

    if (isSpam) {
      sheet.deleteRow(rowIndex);
      deletedCount++;
    }
  }

  var msg = 'SUCCESS: Cleaned ' + deletedCount + ' spam row(s) from sheet.';
  Logger.log(msg);
  return msg;
}
