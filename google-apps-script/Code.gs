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
  'Submission Status'
];

/* =============================================================================
 * HTTP ENTRY POINTS
 * ============================================================================= */

/**
 * Health check / connectivity test.
 * Also returns which spreadsheet is receiving data (so you can verify the link).
 */
function doGet(e) {
  try {
    // Optional: register via GET ?action=submit&data=...
    // (backup path if a browser turns POST into GET on redirect)
    if (e && e.parameter && e.parameter.action === 'submit' && e.parameter.data) {
      return handleRegistration_(e.parameter.data);
    }

    const ss = getSpreadsheet_();
    const sheet = getOrCreateSheet_();
    const lastRow = sheet.getLastRow();
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
    return jsonResponse_({
      success: false,
      message: 'API is reachable but sheet setup failed: ' + String(err.message || err)
    });
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

    // Flush to make sure the write is committed before responding
    SpreadsheetApp.flush();

    return jsonResponse_({
      success: true,
      registrationId: registrationId,
      timestamp: timestamp,
      message: 'Registration submitted successfully.',
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
      email: sanitize_(src.leader_email).toLowerCase(),
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
      email: sanitize_(src['member' + i + '_email']).toLowerCase(),
      whatsapp: normalizePhone_(src['member' + i + '_whatsapp'])
    });
  }

  return data;
}

function validateRegistration_(data) {
  if (!data || typeof data !== 'object') {
    return { ok: false, message: 'Required fields are missing.' };
  }

  if (!data.teamName) {
    return { ok: false, message: 'Team name is required.' };
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

  if (!isValidEmail_(person.email)) {
    return { ok: false, message: label + ' email is invalid.' };
  }
  if (!isValidPhone_(person.whatsapp)) {
    return { ok: false, message: label + ' WhatsApp number is invalid.' };
  }

  return { ok: true };
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
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(email || ''));
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

  row.push(declarationAccepted, 'Submitted');
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

  var e = { postData: { contents: JSON.stringify(sample) } };
  var result = doPost(e);
  Logger.log(result.getContent());
}
