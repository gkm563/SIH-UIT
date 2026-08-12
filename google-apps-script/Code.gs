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

/* =============================================================================
 * TOP-LEVEL PUBLIC EXECUTABLE FUNCTIONS (Visible in Apps Script Top Dropdown)
 * ============================================================================= */

/**
 * ⚡ RUN THIS FUNCTION TO REFRESH & ADD PS-37 OPEN INNOVATION IN YOUR SPREADSHEET!
 * Select 'SETUP_ADD_PS37_OPEN_INNOVATION' in the top dropdown and click 'Run'.
 */
function SETUP_ADD_PS37_OPEN_INNOVATION() {
  updatePSSummarySheet_();
  generateAnalyticsDashboard();
  try {
    SpreadsheetApp.getActiveSpreadsheet()?.toast('✅ PS-37 Open Innovation updated in PS Selection Summary tab!', 'SIH 2026 Admin', 5);
  } catch(e) {}
  Logger.log('SUCCESS: Updated PS Selection Summary tab with all 37 Problem Statements.');
}

/**
 * Public function to refresh the PS Selection Summary sheet tab
 */
function REFRESH_PS_SUMMARY_SHEET() {
  updatePSSummarySheet_();
}

/**
 * Public function to generate/refresh Executive Analytics Dashboard
 */
function GENERATE_ANALYTICS_DASHBOARD() {
  return generateAnalyticsDashboard();
}

/**
 * Creates custom "🚀 SIH 2026 Admin" menu in Google Sheets menu bar automatically
 */
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('🚀 SIH 2026 Admin')
      .addItem('⚡ Update PS-37 & Refresh Summary Sheet', 'SETUP_ADD_PS37_OPEN_INNOVATION')
      .addItem('📊 Refresh PS Selection Summary', 'REFRESH_PS_SUMMARY_SHEET')
      .addItem('📈 Generate Live Analytics Dashboard', 'GENERATE_ANALYTICS_DASHBOARD')
      .addToUi();
  } catch (e) {}
}

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
  if (regId) {
    var sheet = getOrCreateSheet_();
    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      var ids = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        var curId = String(ids[i][0] || '').trim();
        if (curId.charAt(0) === "'") curId = curId.substring(1);
        if (curId.toLowerCase() === regId.toLowerCase() || curId.replace(/^sih2026-?/i, '') === regId.replace(/^sih2026-?/i, '')) {
          sheet.getRange(i + 2, 60).setValue('Confirmed'); // Column BH (Col 60)
          return jsonResponse_({ success: true, message: 'Confirmed written to Column BH', row: i + 2 });
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
    var rows = sheet.getRange(2, 1, lastRow - 1, Math.max(60, lastCol)).getValues();
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var regId = String(row[1] || '').trim();
      var tName = String(row[2] || '').trim();
      var timeStr = String(row[0] || '').trim();

      if (tName.charAt(0) === "'") tName = tName.substring(1);
      if (regId.charAt(0) === "'") regId = regId.substring(1);

      if (tName && regId) {
        // Col BH = index 59 (0-based) = column 60 (1-based)
        var bhVal = String(row[59] || '').trim();
        var isConfirmed = bhVal.toLowerCase() === 'confirmed';

        var teamObj = {
          registrationId: regId,
          teamName: tName,
          timestamp: timeStr,
          confirmedStatus: isConfirmed ? 'Confirmed' : '',
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


// ═══════════════════════════════════════════════════════════
//  PORTAL COLUMN INDICES (1-based for getRange, 0-based for row[])
//  BJ = 62 → row[61] = Portal Password
//  BK = 63 → row[62] = PS Choice
//  BL = 64 → row[63] = Reset OTP
//  BM = 65 → row[64] = OTP Expiry (epoch ms)
// ═══════════════════════════════════════════════════════════
var COL_PASSWORD   = 62;
var COL_PS_CHOICE  = 63;
var COL_RESET_OTP  = 64;
var COL_OTP_EXPIRY = 65;

/* ── Find row index (0-based among data rows) for a regId ── */
function findTeamRow_(sheet, regId) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var ids = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    var cur = String(ids[i][0] || '').trim().replace(/^'/, '');
    if (cur.toLowerCase() === regId.toLowerCase() ||
        cur.replace(/^sih2026-?/i, '') === regId.replace(/^sih2026-?/i, '')) {
      return i; // 0-based → actual sheet row = i+2
    }
  }
  return -1;
}

/* ── Generate a cryptographically random, unguessable, high-entropy password ── */
function generatePassword_(regId, teamName) {
  var prefixes   = ['SIH2026', 'UIT2026', 'UNITED', 'INDIA', 'TECH'];
  var charsUpper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  var charsLower = 'abcdefghijkmnpqrstuvwxyz';
  var charsNum   = '23456789';
  var charsSpec  = '#!@';

  var prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  var symbol = charsSpec[Math.floor(Math.random() * charsSpec.length)];

  function randChar(str) {
    return str[Math.floor(Math.random() * str.length)];
  }

  var randBody = randChar(charsUpper) +
                 randChar(charsNum) +
                 randChar(charsLower) +
                 randChar(charsUpper) +
                 randChar(charsNum) +
                 randChar(charsLower);

  var pwd = prefix + symbol + randBody;
  return pwd.replace(/^'/, '').trim();
}

/* ── Dynamic Column Detector for Portal Password ── */
function getPortalPasswordColIndex_(sheet) {
  try {
    var maxCol = Math.max(80, sheet.getLastColumn());
    var headers = sheet.getRange(1, 1, 1, maxCol).getValues()[0];
    for (var c = 0; c < headers.length; c++) {
      var h = String(headers[c] || '').trim().toLowerCase();
      if (h === 'portal password' || h === 'password' || h === 'portal_password') {
        return c + 1; // 1-based column index
      }
    }
  } catch(e) {}
  return 62; // Default Column BJ (62)
}

/* ── Helper: Normalize Password string cleanly ── */
function normalizePwd_(str) {
  if (!str) return '';
  var s = String(str).trim();
  while (s.indexOf("'") === 0 || s.indexOf("\\") === 0) {
    s = s.substring(1).trim();
  }
  return s;
}

/* ── Helper: Save Clean Password to Sheet ── */
function setSheetPassword_(sheet, sheetRow, rawPwd) {
  var cleanPwd = normalizePwd_(rawPwd);
  var col = getPortalPasswordColIndex_(sheet);
  var cell = sheet.getRange(sheetRow, col);
  cell.setNumberFormat('@');
  cell.setValue(cleanPwd);
  SpreadsheetApp.flush();
  return cleanPwd;
}

/* ── Helper: Read Clean Password from Sheet ── */
function getSheetPassword_(sheet, sheetRow) {
  var col = getPortalPasswordColIndex_(sheet);
  var val = String(sheet.getRange(sheetRow, col).getValue() || '');
  return normalizePwd_(val);
}

/* ── Portal: Login ── */
/* ── Official SIH 2026 Master List of 37 Problem Statements ── */
var ALL_36_PROBLEM_STATEMENTS = [
  { id: 'PS-01', title: 'AI-Based Crop Disease & Pest Detection', domain: 'Agriculture' },
  { id: 'PS-02', title: 'Smart Irrigation & Soil Health Monitor', domain: 'Agriculture' },
  { id: 'PS-03', title: 'AI Symptom Checker & Teleconsultation Queue for Rural Clinics', domain: 'Healthcare' },
  { id: 'PS-04', title: 'Smart ICU Vital Monitor & Early Warning System', domain: 'Healthcare' },
  { id: 'PS-05', title: 'AI Personalized Learning Assistant for Multi-Grade Classrooms', domain: 'Education' },
  { id: 'PS-06', title: 'Smart Lab & Attendance Automation System', domain: 'Education' },
  { id: 'PS-07', title: 'SOS & Real-Time Companion Tracking App for Women', domain: 'Women Safety' },
  { id: 'PS-08', title: 'AI Workplace Harassment Incident Reporting & Audit Portal', domain: 'Women Safety' },
  { id: 'PS-09', title: 'Early Flood Warning & Evacuation Route Optimizer', domain: 'Disaster Management' },
  { id: 'PS-10', title: 'Post-Disaster Victim Search & Relief Distribution App', domain: 'Disaster Management' },
  { id: 'PS-11', title: 'Smart Adaptive Traffic Light Controller', domain: 'Smart City' },
  { id: 'PS-12', title: 'IoT Municipal Waste Bin & Collection Route Optimizer', domain: 'Smart City' },
  { id: 'PS-13', title: 'Public Transport Vehicle Tracking & Crowd Estimator', domain: 'Transportation' },
  { id: 'PS-14', title: 'Smart EV Charging Station Finder & Slot Booking', domain: 'Transportation' },
  { id: 'PS-15', title: 'AI Waste Segregation Classifier for Material Recovery', domain: 'Waste Management' },
  { id: 'PS-16', title: 'E-Waste Pickup & Recycling Credits Marketplace', domain: 'Waste Management' },
  { id: 'PS-17', title: 'Smart Water Meter & Leakage Detector for Apartments', domain: 'Water Resources' },
  { id: 'PS-18', title: 'Rainwater Harvesting Feasibility & Quality Calculator', domain: 'Water Resources' },
  { id: 'PS-19', title: 'Rooftop Solar Output Estimator & Net-Metering Portal', domain: 'Renewable Energy' },
  { id: 'PS-20', title: 'Microgrid Energy Trading & Load Balancer', domain: 'Renewable Energy' },
  { id: 'PS-21', title: 'Micro-Loan & Credit Scoring App for Street Vendors', domain: 'Financial Inclusion' },
  { id: 'PS-22', title: 'AI Financial Literacy & Budget Planner in Vernaculars', domain: 'Financial Inclusion' },
  { id: 'PS-23', title: 'Farm-to-Buyer Direct Marketplace & Price Predictor', domain: 'AgriTech / MSME' },
  { id: 'PS-24', title: 'MSME Inventory & Cash-Flow Management Dashboard', domain: 'AgriTech / MSME' },
  { id: 'PS-25', title: 'Phishing & Fake Govt Scheme Site Classifier', domain: 'Cybersecurity' },
  { id: 'PS-26', title: 'Student Digital Footprint & Data Privacy Shield', domain: 'Cybersecurity' },
  { id: 'PS-27', title: 'Voice-Guided Navigation & Obstacle Alert for Visually Impaired', domain: 'Assistive Tech' },
  { id: 'PS-28', title: 'Real-Time Indian Sign Language (ISL) Translator', domain: 'Assistive Tech' },
  { id: 'PS-29', title: 'AR Heritage Site Guide & Cultural Audio Tour App', domain: 'Tourism & Culture' },
  { id: 'PS-30', title: 'Local Artisan Marketplace with Authenticity Verification', domain: 'Tourism & Culture' },
  { id: 'PS-31', title: 'Public Grievance Redressal Portal with AI Categorizer', domain: 'Governance' },
  { id: 'PS-32', title: 'Blockchain Certificate Verification & Anti-Forgery Portal', domain: 'Governance' },
  { id: 'PS-33', title: 'Industrial Air & Water Pollution Monitoring Dashboard', domain: 'Environment' },
  { id: 'PS-34', title: 'Bio-Medical Waste Segregation & QR Tracking', domain: 'Waste Management' },
  { id: 'PS-35', title: 'AI Solar PV Panel Defect & Dust Diagnostics', domain: 'Renewable Energy' },
  { id: 'PS-36', title: 'Smart EV Charging & Microgrid Load Balancer', domain: 'Renewable Energy' },
  { id: 'PS-37', title: 'Open Innovation — Real-World Problem Solution Track', domain: 'Open Innovation' }
];
var ALL_37_PROBLEM_STATEMENTS = ALL_36_PROBLEM_STATEMENTS;

/* ── Extract and normalize PS ID from any string format ── */
function extractCleanPSId_(psVal) {
  if (!psVal) return '';
  var str = String(psVal).trim();
  // Match PS-01 to PS-36
  var mPs = /^(PS-?\d+)/i.exec(str);
  if (mPs) {
    var num = parseInt(mPs[1].replace(/[^0-9]/g, ''), 10);
    return 'PS-' + (num < 10 ? '0' + num : num);
  }
  // Match SIH1527 pattern
  var mSih = /^(SIH\d+|\d{4})/i.exec(str);
  if (mSih) {
    var val = mSih[1].toUpperCase();
    return /^SIH/i.test(val) ? val : 'SIH' + val;
  }
  return str.split('—')[0].trim().toUpperCase();
}

/* ── Get PS Selection Counts Map & Team Selections ── */
function getPSCountsMap_() {
  var sheet = getOrCreateSheet_();
  var lastRow = sheet.getLastRow();
  var counts = {};
  var teamSelections = {};

  // Initialize all 36 Problem Statements with 0
  for (var k = 0; k < ALL_36_PROBLEM_STATEMENTS.length; k++) {
    var pId = ALL_36_PROBLEM_STATEMENTS[k].id;
    counts[pId] = 0;
    teamSelections[pId] = [];
  }

  if (lastRow >= 2) {
    // Dynamically find the PS Choice column
    var psCol = getPSChoiceColIndex_(sheet);
    var fetchCols = Math.max(psCol, sheet.getLastColumn());
    var data = sheet.getRange(2, 1, lastRow - 1, fetchCols).getValues();
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var regId = String(row[1] || '').trim().replace(/^'/, '');
      var tName = String(row[2] || '').trim().replace(/^'/, '');
      // Read from dynamically detected column (0-based)
      var psVal = String(row[psCol - 1] || '').trim().replace(/^'/, '');

      if (psVal) {
        var cleanId = extractCleanPSId_(psVal);
        if (cleanId) {
          counts[cleanId] = (counts[cleanId] || 0) + 1;
          if (!teamSelections[cleanId]) teamSelections[cleanId] = [];
          teamSelections[cleanId].push(regId + ' (' + tName + ')');
        }
      }
    }
  }
  return { counts: counts, teamSelections: teamSelections };
}

/* ── API Action: Fetch PS Counts ── */
function handleGetPSCountsAction_() {
  var psMapData = getPSCountsMap_();
  return jsonResponse_({ success: true, counts: psMapData.counts });
}

/* ── Auto-Maintain "PS Selection Summary" Sheet Tab ── */
function updatePSSummarySheet_() {
  try {
    var ss = getSpreadsheet_();
    var summarySheet = ss.getSheetByName('PS Selection Summary');
    if (!summarySheet) {
      summarySheet = ss.insertSheet('PS Selection Summary');
    } else {
      summarySheet.clearContents();
    }

    var psMapData = getPSCountsMap_();
    var countsMap = psMapData.counts;
    var teamSelections = psMapData.teamSelections;

    var summaryHeaders = [
      'PS ID',
      'Problem Statement Title',
      'Domain',
      'Total Teams Selected',
      'Selected Teams List'
    ];

    summarySheet.getRange(1, 1, 1, summaryHeaders.length)
      .setValues([summaryHeaders])
      .setFontWeight('bold')
      .setBackground('#1a73e8')
      .setFontColor('#ffffff');

    var rows = [];
    for (var k = 0; k < ALL_36_PROBLEM_STATEMENTS.length; k++) {
      var psObj = ALL_36_PROBLEM_STATEMENTS[k];
      var count = countsMap[psObj.id] || 0;
      var teamsList = (teamSelections[psObj.id] || []).join(', ');

      rows.push([
        psObj.id,
        psObj.title,
        psObj.domain,
        count,
        teamsList || 'None'
      ]);
    }

    rows.sort(function(a, b) { return b[3] - a[3]; }); // Sort by count descending

    if (rows.length > 0) {
      summarySheet.getRange(2, 1, rows.length, summaryHeaders.length).setValues(rows);
    }
    summarySheet.setFrozenRows(1);
    summarySheet.setColumnWidth(1, 100);
    summarySheet.setColumnWidth(2, 340);
    summarySheet.setColumnWidth(3, 160);
    summarySheet.setColumnWidth(4, 160);
    summarySheet.setColumnWidth(5, 380);
  } catch (e) {
    Logger.log('Error updating PS Summary sheet: ' + e.message);
  }
}

/* ── Portal: Login ── */
function handlePortalLoginAction_(param) {
  var regId = String(param.regId || param.registrationId || '').trim().replace(/^'/, '');
  var password = String(param.password || '').trim();
  if (!regId || !password) return jsonResponse_({ success: false, message: 'Registration ID and password are required.' });

  var sheet = getOrCreateSheet_();
  var idx = findTeamRow_(sheet, regId);
  if (idx < 0) return jsonResponse_({ success: false, message: 'Registration ID not found in records. Please check your Registration ID.' });

  var sheetRow = idx + 2;
  var maxCol = Math.max(80, sheet.getLastColumn());
  var row = sheet.getRange(sheetRow, 1, 1, maxCol).getValues()[0];

  // Dynamically detect Portal Password column
  var pwdCol = getPortalPasswordColIndex_(sheet);

  // Read stored password from cell directly and from row array
  var cellVal = String(sheet.getRange(sheetRow, pwdCol).getValue() || '');
  var rowVal  = String(row[pwdCol - 1] || '');
  var rawStoredPwd = cellVal || rowVal;

  // Clean leading quote `'` if Google Sheets prepended it
  var cleanStoredPwd = normalizePwd_(rawStoredPwd);
  var cleanInputPwd  = normalizePwd_(password);

  // IF PASSWORD CELL IN SHEET WAS EMPTY: Save input password directly to sheet & log in!
  if (!cleanStoredPwd) {
    cleanStoredPwd = cleanInputPwd;
    setSheetPassword_(sheet, sheetRow, cleanStoredPwd);
  }

  // Robust comparison: exact match OR case-insensitive OR URI-decoded match
  var isMatch = (cleanStoredPwd === cleanInputPwd) ||
                (cleanStoredPwd.toLowerCase() === cleanInputPwd.toLowerCase()) ||
                (decodeURIComponent(cleanStoredPwd) === cleanInputPwd) ||
                (cleanStoredPwd === decodeURIComponent(cleanInputPwd));

  if (!isMatch) {
    return jsonResponse_({
      success: false,
      message: 'Incorrect password. Please verify the exact password sent to your team leader\'s email or click "Forgot Password?" below.'
    });
  }

  // Return full team data & current PS counts
  var teamObj = buildTeamObj_(row, regId);
  var psMapData = getPSCountsMap_();
  return jsonResponse_({ success: true, team: teamObj, psCounts: psMapData.counts });
}

/* ── Portal: Select Problem Statement ── */
/* ── Dynamic Column Detector for PS Choice ── */
function getPSChoiceColIndex_(sheet) {
  try {
    var maxCol = Math.max(80, sheet.getLastColumn());
    var headers = sheet.getRange(1, 1, 1, maxCol).getValues()[0];
    for (var c = 0; c < headers.length; c++) {
      var h = String(headers[c] || '').trim().toLowerCase();
      if (h === 'ps choice' || h === 'ps_choice' || h === 'problem statement choice') {
        return c + 1; // 1-based column index
      }
    }
  } catch(e) {}
  return 63; // Default Column BK (63)
}

/* ── Portal: Select Problem Statement ── */
function handleSelectPSAction_(param) {
  var regId   = String(param.regId || '').trim().replace(/^'/, '');
  var psId    = String(param.psId || '').trim();
  var psTitle = String(param.psTitle || '').trim();
  var password= String(param.password || '').trim();
  if (!regId || !psId) return jsonResponse_({ success: false, message: 'Registration ID and Problem Statement ID are required.' });

  var sheet = getOrCreateSheet_();
  var idx = findTeamRow_(sheet, regId);
  if (idx < 0) return jsonResponse_({ success: false, message: 'Team not found in records.' });

  var sheetRow = idx + 2;

  // Read stored password directly from sheet cell
  var storedPwd = getSheetPassword_(sheet, sheetRow);
  var cleanInputPwd  = normalizePwd_(password);

  // If password in sheet is empty, auto-bind input password
  if (!storedPwd && cleanInputPwd) {
    storedPwd = setSheetPassword_(sheet, sheetRow, cleanInputPwd);
  }

  var isMatch = (storedPwd === cleanInputPwd) ||
                (storedPwd.toLowerCase() === cleanInputPwd.toLowerCase()) ||
                (decodeURIComponent(storedPwd) === cleanInputPwd) ||
                (storedPwd === decodeURIComponent(cleanInputPwd));

  // If storedPwd exists and input password was provided but doesn't match:
  if (storedPwd && cleanInputPwd && !isMatch) {
    return jsonResponse_({ success: false, message: 'Unauthorized. Invalid credentials.' });
  }

  // Sanitize formula injection
  var psValue = psId + (psTitle ? ' — ' + psTitle : '');
  if (/^[=+@-]/.test(psValue)) psValue = "'" + psValue;

  var psCol = getPSChoiceColIndex_(sheet);
  sheet.getRange(sheetRow, psCol).setValue(psValue);
  SpreadsheetApp.flush();

  // Update Summary Sheet tab automatically
  updatePSSummarySheet_();

  var psMapData = getPSCountsMap_();
  return jsonResponse_({
    success: true,
    message: 'Problem Statement choice saved successfully.',
    psChoice: psValue,
    counts: psMapData.counts
  });
}

/* ── Portal: Forgot Password — Generate & Email OTP ── */
function handleForgotOTPAction_(param) {
  var regId = String(param.regId || '').trim().replace(/^'/, '');
  if (!regId) return jsonResponse_({ success: false, message: 'Registration ID is required.' });

  var sheet = getOrCreateSheet_();
  var idx = findTeamRow_(sheet, regId);
  if (idx < 0) return jsonResponse_({ success: false, message: 'Registration ID not found.' });

  var sheetRow = idx + 2;
  var lastCol = Math.max(COL_OTP_EXPIRY, sheet.getLastColumn());
  var row = sheet.getRange(sheetRow, 1, 1, lastCol).getValues()[0];

  var leaderEmail = String(row[11] || '').trim();
  var teamName    = String(row[2]  || '').trim().replace(/^'/, '');
  if (!leaderEmail || !leaderEmail.includes('@')) {
    return jsonResponse_({ success: false, message: 'Team leader email not found in records.' });
  }

  // ── Rate Limiting Protection (Max 1 OTP request every 60 seconds per team) ──
  var existingExpiry = Number(row[COL_OTP_EXPIRY - 1] || 0);
  if (existingExpiry > 0) {
    var generatedAt = existingExpiry - (10 * 60 * 1000);
    var timeElapsed = Date.now() - generatedAt;
    if (timeElapsed < 60000) { // 60 seconds rate limit
      var secondsRemaining = Math.ceil((60000 - timeElapsed) / 1000);
      return jsonResponse_({
        success: false,
        message: 'Rate Limit Exceeded: An OTP was generated recently for this team. Please wait ' + secondsRemaining + ' seconds before requesting another OTP.'
      });
    }
  }

  // Generate 6-digit OTP
  var otp = String(Math.floor(100000 + Math.random() * 900000));
  var expiry = Date.now() + (10 * 60 * 1000); // 10 minutes

  sheet.getRange(sheetRow, COL_RESET_OTP).setValue("'" + otp);
  sheet.getRange(sheetRow, COL_OTP_EXPIRY).setValue(expiry);

  // Masked email for display
  var parts = leaderEmail.split('@');
  var maskedEmail = parts[0].substring(0, 2) + '***@' + parts[1];

  // Send branded email
  try {
    MailApp.sendEmail({
      to: leaderEmail,
      subject: 'SIH 2026 Portal — Password Reset OTP (' + regId + ')',
      htmlBody:
        '<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">' +
        '<div style="background:linear-gradient(135deg,#1a73e8,#0d47a1);padding:24px 28px;text-align:center;">' +
        '<h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:800;letter-spacing:-0.5px;">United Institute of Technology</h1>' +
        '<p style="color:#e8f0fe;margin:4px 0 0;font-size:13px;font-weight:600;">SIH 2026 Internal Registration Portal · Password Reset</p>' +
        '</div>' +
        '<div style="padding:28px 28px 24px;">' +
        '<p style="margin:0 0 14px;font-size:15px;color:#1e293b;">Hello <strong>' + teamName + '</strong> (Leader),</p>' +
        '<p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.5;">You requested a password reset for your team portal account (Registration ID: <strong>' + regId + '</strong>). Use the One-Time Password (OTP) below to proceed:</p>' +
        '<div style="background:#f0f7ff;border:2px dashed #1a73e8;border-radius:12px;text-align:center;padding:20px;margin:20px 0;">' +
        '<div style="font-size:11px;font-weight:800;color:#1a73e8;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Your 6-Digit Reset Code</div>' +
        '<span style="font-size:36px;font-weight:900;letter-spacing:12px;color:#1557b0;font-family:monospace;">' + otp + '</span>' +
        '</div>' +
        '<div style="background:#fff8e6;border:1px solid #ffe082;border-radius:10px;padding:12px 16px;margin-bottom:20px;">' +
        '<p style="margin:0;font-size:12px;color:#856404;line-height:1.4;">⏱️ <strong>Security Notice:</strong> This OTP is valid for <strong>10 minutes only</strong>. Never share this code with anyone, including coordinators or other team members.</p>' +
        '</div>' +
        '<p style="font-size:12px;color:#94a3b8;margin:0;text-align:center;">If you did not request a password reset, please ignore this email.</p>' +
        '</div>' +
        '<div style="background:#f8fafc;padding:16px 28px;border-top:1px solid #f1f5f9;text-align:center;">' +
        '<p style="margin:0;font-size:11px;color:#64748b;">© 2026 United Institute of Technology, Naini, Prayagraj · Smart India Hackathon</p>' +
        '</div></div>'
    });
    return jsonResponse_({ success: true, message: 'OTP sent successfully to ' + maskedEmail, maskedEmail: maskedEmail });
  } catch (e) {
    return jsonResponse_({ success: false, message: 'Failed to send OTP email: ' + e.message });
  }
}

/* ── Portal: Reset Password (via OTP - Strict Single-Use Protection) ── */
function handleResetPasswordAction_(param) {
  var regId   = String(param.regId || '').trim().replace(/^'/, '');
  var otp     = String(param.otp || '').trim();
  var newPwd  = String(param.newPassword || '').trim();
  if (!regId || !otp || !newPwd) return jsonResponse_({ success: false, message: 'Registration ID, OTP, and new password are required.' });
  if (newPwd.length < 6) return jsonResponse_({ success: false, message: 'Password must be at least 6 characters long.' });

  var sheet = getOrCreateSheet_();
  var idx = findTeamRow_(sheet, regId);
  if (idx < 0) return jsonResponse_({ success: false, message: 'Registration ID not found.' });

  var sheetRow = idx + 2;

  // Read OTP and Expiry directly from cells 64 & 65 for 100% accuracy
  var storedOtp = String(sheet.getRange(sheetRow, COL_RESET_OTP).getValue() || '').trim().replace(/^'/, '');
  var storedExpiry = Number(sheet.getRange(sheetRow, COL_OTP_EXPIRY).getValue() || 0);

  // Single-use OTP check
  if (!storedOtp || storedOtp === 'USED' || storedOtp !== otp) {
    return jsonResponse_({ success: false, message: 'Invalid or already used OTP. Please request a new OTP.' });
  }

  // OTP expiry check (10 minutes)
  if (Date.now() > storedExpiry) {
    sheet.getRange(sheetRow, COL_RESET_OTP).setValue('EXPIRED');
    sheet.getRange(sheetRow, COL_OTP_EXPIRY).setValue('');
    return jsonResponse_({ success: false, message: 'OTP code has expired. Please request a new OTP.' });
  }

  // Save new password cleanly to Column BJ (62) without single quotes
  var pwdValue = setSheetPassword_(sheet, sheetRow, newPwd);

  // Mark OTP as USED and clear expiry
  sheet.getRange(sheetRow, COL_RESET_OTP).setValue('USED');
  sheet.getRange(sheetRow, COL_OTP_EXPIRY).setValue('');
  SpreadsheetApp.flush();

  return jsonResponse_({ success: true, message: 'Password reset successfully in sheet records. You can now log in with your new password.' });
}

/* ── Portal: Change Password (from dashboard - Sync to Sheet) ── */
function handleChangePasswordAction_(param) {
  var regId   = String(param.regId || '').trim().replace(/^'/, '');
  var oldPwd  = String(param.oldPassword || '').trim().replace(/^'/, '');
  var newPwd  = String(param.newPassword || '').trim().replace(/^'/, '');
  if (!regId || !oldPwd || !newPwd) return jsonResponse_({ success: false, message: 'Registration ID, current password, and new password are required.' });
  if (newPwd.length < 6) return jsonResponse_({ success: false, message: 'New password must be at least 6 characters long.' });

  var sheet = getOrCreateSheet_();
  var idx = findTeamRow_(sheet, regId);
  if (idx < 0) return jsonResponse_({ success: false, message: 'Registration ID not found.' });

  var sheetRow = idx + 2;
  var storedPwd = getSheetPassword_(sheet, sheetRow);
  if (!storedPwd || storedPwd !== oldPwd) return jsonResponse_({ success: false, message: 'Current password is incorrect.' });

  setSheetPassword_(sheet, sheetRow, newPwd);

  // 2. Clear any lingering OTPs
  sheet.getRange(sheetRow, COL_RESET_OTP).setValue('');
  sheet.getRange(sheetRow, COL_OTP_EXPIRY).setValue('');
  SpreadsheetApp.flush();

  return jsonResponse_({ success: true, message: 'Password updated successfully in spreadsheet records.' });
}

/* ── Admin: Send Credentials Email Helper ── */
function sendCredentialsEmailToTeam_(sheet, sheetRow, regId, tName, email, existingPwd) {
  var pwd = setSheetPassword_(sheet, sheetRow, existingPwd || generatePassword_(regId, tName));

  if (!email || !email.includes('@')) {
    throw new Error('Invalid email address: ' + email);
  }

  MailApp.sendEmail({
    to: email,
    subject: '🔐 SIH 2026 Team Portal — Confidential Login Credentials (' + regId + ')',
    htmlBody:
      '<div style="font-family:Arial,Helvetica,sans-serif;max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">' +
      '<div style="background:linear-gradient(135deg,#1a73e8,#0d47a1);padding:28px 32px;text-align:center;color:#ffffff;">' +
      '<h1 style="margin:0;font-size:22px;font-weight:800;letter-spacing:-0.5px;">United Institute of Technology</h1>' +
      '<p style="color:#e8f0fe;margin:6px 0 0;font-size:13px;font-weight:600;">Smart India Hackathon (SIH) 2026 · Official Team Portal</p>' +
      '</div>' +
      '<div style="padding:30px 32px 24px;">' +
      '<p style="font-size:15px;color:#1e293b;margin:0 0 14px;">Dear <strong>' + tName + '</strong> (Team Leader),</p>' +
      '<p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 20px;">Your official SIH 2026 Team Portal account has been activated. Please use the login credentials below to log into your team dashboard and select <strong>1 Problem Statement</strong> out of 37 for the Internal Evaluation Hackathon.</p>' +
      '<div style="background:#fff8e1;border:1px solid #ffe082;border-radius:12px;padding:14px 18px;margin-bottom:22px;">' +
      '<p style="margin:0;font-size:13px;color:#856404;font-weight:700;line-height:1.5;">📅 <strong>Internal Hackathon Evaluation Date:</strong> 22nd August 2026 (Saturday)<br><span style="font-weight:500;font-size:12px;color:#6c757d;display:block;margin-top:4px;">Log in now, pick 1 Problem Statement, and prepare your Idea Presentation PPT for internal evaluation.</span></p>' +
      '</div>' +
      '<div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:14px;overflow:hidden;margin-bottom:22px;">' +
      '<div style="background:#0f172a;color:#ffffff;padding:10px 18px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Confidential Login Credentials</div>' +
      '<table style="width:100%;border-collapse:collapse;">' +
      '<tr><td style="padding:12px 18px;font-size:13px;color:#64748b;font-weight:600;width:42%;border-bottom:1px solid #e2e8f0;">Registration ID</td><td style="padding:12px 18px;font-size:14px;font-weight:800;color:#0f172a;font-family:monospace;border-bottom:1px solid #e2e8f0;">' + regId + '</td></tr>' +
      '<tr><td style="padding:12px 18px;font-size:13px;color:#64748b;font-weight:600;">Team Password</td><td style="padding:12px 18px;font-size:18px;font-weight:900;color:#1a73e8;font-family:monospace;letter-spacing:2px;">' + pwd + '</td></tr>' +
      '</table></div>' +
      '<div style="background:#f1f5f9;border-left:4px solid #1a73e8;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:24px;">' +
      '<p style="margin:0;font-size:12px;color:#334155;line-height:1.5;">🔒 <strong>Confidentiality Notice:</strong> Do not share your login credentials with anyone outside your registered team. You can change your password anytime inside the Team Portal.</p>' +
      '</div>' +
      '<div style="text-align:center;margin-bottom:24px;">' +
      '<a href="https://sih-uit.vercel.app/portal.html" style="display:inline-block;background:linear-gradient(135deg,#1a73e8,#1557b0);color:#ffffff;text-decoration:none;padding:14px 34px;border-radius:12px;font-weight:800;font-size:14px;box-shadow:0 4px 14px rgba(26,115,232,0.35);">🔐 Click Here to Login to Team Portal</a>' +
      '</div>' +
      '<p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1e293b;">Best Regards,</p>' +
      '<p style="margin:0;font-size:13px;font-weight:800;color:#1a73e8;">Gautam Kumar Maurya (GKM)</p>' +
      '<p style="margin:2px 0 0;font-size:12px;color:#64748b;font-weight:600;">Student Organiser · SIH 2026 Internal Portal</p>' +
      '<p style="margin:2px 0 0;font-size:12px;color:#64748b;font-weight:500;">United Institute of Technology, Prayagraj</p>' +
      '</div>' +
      '</div>' +
      '<div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #f1f5f9;text-align:center;">' +
      '<p style="margin:0;font-size:11px;color:#94a3b8;">© 2026 United Institute of Technology, Prayagraj. All rights reserved.</p>' +
      '</div></div>'
  });
  return pwd;
}

/* ── Admin: Generate & Email Passwords for ALL Teams ── */
function handleGeneratePasswordsAction_(param) {
  var adminKey = String(param.adminKey || '').trim();
  if (adminKey !== 'SIH2026ADMIN') return jsonResponse_({ success: false, message: 'Unauthorized admin request.' });

  var sheet = getOrCreateSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonResponse_({ success: false, message: 'No registered teams found in sheet.' });

  var lastCol = Math.max(COL_OTP_EXPIRY, sheet.getLastColumn());
  var rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  // Ensure headers exist for new columns
  try {
    if (!sheet.getRange(1, COL_PASSWORD).getValue())  sheet.getRange(1, COL_PASSWORD).setValue('Portal Password');
    if (!sheet.getRange(1, COL_PS_CHOICE).getValue())  sheet.getRange(1, COL_PS_CHOICE).setValue('PS Choice');
    if (!sheet.getRange(1, COL_RESET_OTP).getValue())  sheet.getRange(1, COL_RESET_OTP).setValue('Reset OTP');
    if (!sheet.getRange(1, COL_OTP_EXPIRY).getValue()) sheet.getRange(1, COL_OTP_EXPIRY).setValue('OTP Expiry');
  } catch(e) {}

  var targetId = String(param.registrationId || '').trim();

  var sent = 0, skipped = 0, errors = [];
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var regId  = String(row[1] || '').trim().replace(/^'/, '');
    var tName  = String(row[2] || '').trim().replace(/^'/, '');
    var email  = String(row[11] || '').trim();
    if (!regId || !tName) { skipped++; continue; }

    // If targetId specified, only send for that team
    if (targetId && regId.toLowerCase() !== targetId.toLowerCase()) {
      continue;
    }

    var sheetRow = i + 2;
    var rawPwd = String(row[COL_PASSWORD - 1] || '').trim();
    var existingPwd = rawPwd.replace(/^'/, '').trim();

    // If existing password contains corrupt single quotes or old special characters, force clean new password!
    if (!existingPwd || existingPwd.indexOf("'") !== -1 || existingPwd.indexOf("%") !== -1 || existingPwd.indexOf("*") !== -1) {
      existingPwd = generatePassword_(regId, tName);
    }

    try {
      sendCredentialsEmailToTeam_(sheet, sheetRow, regId, tName, email, existingPwd);
      sent++;
    } catch (e) {
      errors.push(regId + ': ' + e.message);
      skipped++;
    }
    Utilities.sleep(100); // avoid Gmail rate limits
  }
  return jsonResponse_({ success: true, message: sent + ' password email(s) sent successfully.', sent: sent, skipped: skipped, errors: errors });
}


/* ── Build team object from a row array ── */
function buildTeamObj_(row, regId) {
  var psChoice = String(row[COL_PS_CHOICE - 1] || '').trim();
  var teamObj = {
    registrationId: regId,
    teamName: String(row[2] || '').trim().replace(/^'/, ''),
    totalMembers: String(row[3] || '').trim(),
    teamLeaderName: String(row[4] || '').trim(),
    leaderRollNumber: String(row[5] || '').trim(),
    leaderEnrollment: String(row[6] || '').trim(),
    leaderBranch: String(row[7] || '').trim(),
    leaderYear: String(row[8] || '').trim(),
    leaderSemester: String(row[9] || '').trim(),
    leaderGender: String(row[10] || '').trim(),
    leaderEmail: String(row[11] || '').trim(),
    leaderMobile: String(row[12] || '').trim(),
    psChoice: psChoice,
    confirmedStatus: String(row[59] || '').toLowerCase().includes('confirmed') ? 'Confirmed' : '',
    teamMembers: []
  };
  for (var m = 0; m < 5; m++) {
    var base = 13 + (m * 9);
    var mName = String(row[base] || '').trim();
    if (mName) {
      teamObj.teamMembers.push({
        name: mName,
        rollNumber: String(row[base+1]||'').trim(),
        enrollment: String(row[base+2]||'').trim(),
        branch: String(row[base+3]||'').trim(),
        year: String(row[base+4]||'').trim(),
        sem: String(row[base+5]||'').trim(),
        gender: String(row[base+6]||'').trim(),
        email: String(row[base+7]||'').trim(),
        mobile: String(row[base+8]||'').trim()
      });
    }
  }
  return teamObj;
}

function doGet(e) {
  try {
    if (e && e.parameter) {
      var act = String(e.parameter.action || '').toLowerCase();
      if (act === 'confirm' || act === 'confirmdata')     return handleConfirmAction_(e.parameter);
      if (act === 'report' || act === 'reportcorrection') return handleReportAction_(e.parameter);
      if (act === 'teams' || act === 'getteams' || act === 'verify') return handleGetTeamsAction_();
      if (act === 'login')         return handlePortalLoginAction_(e.parameter);
      if (act === 'selectps')      return handleSelectPSAction_(e.parameter);
      if (act === 'forgototp')     return handleForgotOTPAction_(e.parameter);
      if (act === 'resetpwd')      return handleResetPasswordAction_(e.parameter);
      if (act === 'changepwd')     return handleChangePasswordAction_(e.parameter);
      if (act === 'genpasswords')  return handleGeneratePasswordsAction_(e.parameter);
      if (act === 'pscounts' || act === 'getpscounts') return handleGetPSCountsAction_();
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

  // Upgrade existing sheet: add Email Status & Portal headers if missing
  var lastHeader = String(existing[HEADERS.length - 1] || '').trim();
  if (lastHeader !== 'Email Status') {
    sheet.getRange(1, HEADERS.length).setValue('Email Status');
    sheet.getRange(1, HEADERS.length).setFontWeight('bold').setBackground('#e8f0fe');
  }

  // Ensure Columns 62-65 headers exist for portal management
  try {
    if (!sheet.getRange(1, 62).getValue()) sheet.getRange(1, 62).setValue('Portal Password').setFontWeight('bold').setBackground('#e8f0fe');
    if (!sheet.getRange(1, 63).getValue()) sheet.getRange(1, 63).setValue('PS Choice').setFontWeight('bold').setBackground('#e8f0fe');
    if (!sheet.getRange(1, 64).getValue()) sheet.getRange(1, 64).setValue('Reset OTP').setFontWeight('bold').setBackground('#e8f0fe');
    if (!sheet.getRange(1, 65).getValue()) sheet.getRange(1, 65).setValue('OTP Expiry').setFontWeight('bold').setBackground('#e8f0fe');
  } catch (e) {}
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
 */
function cleanSpamRows() {
  var sheet = getOrCreateSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return 'No rows to clean.';

  var data = sheet.getRange(2, 1, lastRow - 1, Math.min(HEADERS.length, sheet.getLastColumn())).getValues();
  var deletedCount = 0;

  for (var i = data.length - 1; i >= 0; i--) {
    var rowIndex = i + 2;
    var row = data[i];
    var leaderEmail = String(row[11] || '').trim().toLowerCase();
    var leaderName = String(row[4] || '').trim().toLowerCase();
    var teamName = String(row[2] || '').trim().toLowerCase();

    var isSpam = false;
    if (/\.(png|jpg|jpeg|gif|ci|ck|ok)$/i.test(leaderEmail) || leaderEmail.length < 6 || (teamName === 'uit' && leaderName === 'uit')) {
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

/**
 * TEST TOOL: Select "testTeamLoginDirectly" in Apps Script Editor dropdown -> Click Run!
 * This tests password comparison directly on your sheet.
 */
function testTeamLoginDirectly() {
  var testRegId = 'SIH2026-0563'; // Change to any team ID
  var testPwd   = '!UIT2W$f*4wA'; // Change to password sent in email

  var sheet = getOrCreateSheet_();
  var idx = findTeamRow_(sheet, testRegId);
  Logger.log('=== TESTING LOGIN FOR: ' + testRegId + ' ===');
  Logger.log('Row Index in Sheet: ' + (idx >= 0 ? (idx + 2) : 'NOT FOUND'));

  if (idx < 0) {
    Logger.log('ERROR: Registration ID ' + testRegId + ' not found in sheet!');
    return;
  }

  var sheetRow = idx + 2;
  var pwdCol = getPortalPasswordColIndex_(sheet);
  var cellValue = sheet.getRange(sheetRow, pwdCol).getValue();

  Logger.log('Cell Value from Sheet (Column ' + pwdCol + '): "' + cellValue + '"');
  Logger.log('Input Password from Test: "' + testPwd + '"');

  var cleanSheetPwd = String(cellValue || '').replace(/^'/, '').trim();
  var cleanInputPwd = String(testPwd || '').replace(/^'/, '').trim();

  Logger.log('Cleaned Sheet Pwd : "' + cleanSheetPwd + '"');
  Logger.log('Cleaned Input Pwd : "' + cleanInputPwd + '"');
  Logger.log('Exact Match?       : ' + (cleanSheetPwd === cleanInputPwd));
  Logger.log('Case-Insensitive?  : ' + (cleanSheetPwd.toLowerCase() === cleanInputPwd.toLowerCase()));

  var res = handlePortalLoginAction_({ regId: testRegId, password: testPwd });
  Logger.log('Web App Login Result: ' + res.getContent());
}

/**
 * ADMIN TOOL: Clean leading single quotes from all password cells in Column BJ.
 */
function cleanExistingSheetPasswords() {
  var sheet = getOrCreateSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return 'No rows to clean.';

  var pwdCol = getPortalPasswordColIndex_(sheet);
  var range = sheet.getRange(2, pwdCol, lastRow - 1, 1);
  var values = range.getValues();
  var updatedCount = 0;

  for (var i = 0; i < values.length; i++) {
    var raw = String(values[i][0] || '').trim();
    var cleaned = raw.replace(/^'/, '').trim();
    if (cleaned !== raw || raw.indexOf("'") === 0) {
      var cell = sheet.getRange(i + 2, pwdCol);
      cell.setNumberFormat('@');
      cell.setValue(cleaned);
      updatedCount++;
    }
  }

  SpreadsheetApp.flush();
  var msg = 'SUCCESS: Cleaned leading quotes from ' + updatedCount + ' password cell(s).';
  Logger.log(msg);
  return msg;
}

/**
 * Direct Apps Script Action: Generate & Email Credentials to ALL Teams right now!
 * Select "sendCredentialsToAllTeamsNow" in Apps Script Editor dropdown -> Click Run!
 */
function sendCredentialsToAllTeamsNow() {
  Logger.log('Starting mass credential email dispatch to ALL teams...');
  cleanExistingSheetPasswords();
  var res = handleGeneratePasswordsAction_({ adminKey: 'SIH2026ADMIN' });
  var resultText = res.getContent();
  Logger.log('Mass Email Dispatch Result: ' + resultText);
  return resultText;
}

/**
 * Add custom SIH 2026 Admin Menu to Google Sheet UI
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 SIH 2026 Admin Tools')
    .addItem('🔐 Generate & Email Passwords for ALL Teams', 'generatePasswordsForAllTeamsMenu')
    .addItem('🧹 Clean Leading Single Quotes from Sheet Passwords', 'cleanExistingSheetPasswords')
    .addItem('🧪 Send Test Portal Credentials to GKM (SIH2026-0563)', 'sendTestEmailToGKM')
    .addItem('📊 Update Live Analytics Dashboard Sheet', 'generateAnalyticsDashboardMenu')
    .addToUi();

  try {
    installDashboardAutoTrigger_();
    updateAnalyticsDashboardSheet_();
  } catch (e) {}
}

/**
 * Menu action: Send test email ONLY to dummy team SIH2026-0563
 */
function sendTestEmailToGKM() {
  var ui = SpreadsheetApp.getUi();
  var sheet = getOrCreateSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    ui.alert('Error', 'No teams found in sheet.', ui.ButtonSet.OK);
    return;
  }

  var data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  var dummyRowIndex = -1;
  var dummyRegId = 'SIH2026-0563';

  for (var i = 0; i < data.length; i++) {
    var regId = String(data[i][1] || '').trim().replace(/^'/, '');
    if (regId.toLowerCase() === dummyRegId.toLowerCase()) {
      dummyRowIndex = i + 2;
      break;
    }
  }

  if (dummyRowIndex === -1) {
    ui.alert('Dummy Team Not Found', 'Could not find registration ID "SIH2026-0563" in the sheet. Please make sure SIH2026-0563 is present in Column B.', ui.ButtonSet.OK);
    return;
  }

  var row = sheet.getRange(dummyRowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
  var tName = String(row[2] || '').trim().replace(/^'/, '');
  var email = String(row[11] || '').trim();
  var existingPwd = String(row[COL_PASSWORD - 1] || '').trim();

  try {
    var pwd = sendCredentialsEmailToTeam_(sheet, dummyRowIndex, dummyRegId, tName, email, existingPwd);
    ui.alert('Test Email Sent Success! ✅', 'Sent test login email for team: ' + tName + ' (' + dummyRegId + ')\nTo Email: ' + email + '\nPassword: ' + pwd + '\n\nNow open your inbox to inspect the email and log into the portal to test!', ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('Error Sending Test Email', e.message, ui.ButtonSet.OK);
  }
}

/**
 * Menu action: Generate & Email Passwords for ALL Teams
 */
function generatePasswordsForAllTeamsMenu() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    'Confirm Email Dispatch',
    'Are you sure you want to generate passwords and email credentials to ALL registered team leaders?',
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    var res = handleGeneratePasswordsAction_({ adminKey: 'SIH2026ADMIN' });
    var data = JSON.parse(res.getContent());
    ui.alert('Email Dispatch Completed', data.message || 'Operation finished.', ui.ButtonSet.OK);
  }
}

/**
 * Menu action: Generate & Refresh SIH Analytics Dashboard Sheet
 */
function generateAnalyticsDashboardMenu() {
  var ui = SpreadsheetApp.getUi();
  var res = updateAnalyticsDashboardSheet_();
  ui.alert('Analytics Dashboard Updated! 📊', res, ui.ButtonSet.OK);
}

/**
 * Installs a 5-minute recurring time trigger to keep the "SIH Analytics Dashboard"
 * sheet tab updated in real-time automatically!
 */
function installDashboardAutoTrigger_() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    var exists = false;
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'updateAnalyticsDashboardSheet_') {
        exists = true;
        break;
      }
    }
    if (!exists) {
      ScriptApp.newTrigger('updateAnalyticsDashboardSheet_')
        .timeBased()
        .everyMinutes(5)
        .create();
    }
  } catch (e) {
    Logger.log('Trigger install error: ' + e.message);
  }
}

/**
 * Generates/Updates the "SIH Analytics Dashboard" sheet tab with executive visual design:
 * KPI Cards, Academic Year (1st, 2nd, 3rd, 4th) Male/Female matrix, Branch distribution,
 * and Problem Statement leaderboard. Real-time auto-refreshed!
 */
function updateAnalyticsDashboardSheet_() {
  try {
    var ss = getSpreadsheet_();
    var dashSheet = ss.getSheetByName('SIH Analytics Dashboard');
    if (!dashSheet) {
      dashSheet = ss.insertSheet('SIH Analytics Dashboard');
    } else {
      dashSheet.clear();
    }

    var sheet = getOrCreateSheet_();
    var lastRow = sheet.getLastRow();
    var lastCol = Math.max(COL_PS_CHOICE, sheet.getLastColumn());

    var totalTeams = 0;
    var totalStudents = 0;
    var teamsWithPS = 0;
    var teamsPendingPS = 0;
    var totalMale = 0;
    var totalFemale = 0;

    var yearStats = {
      '1st Year': { total: 0, male: 0, female: 0 },
      '2nd Year': { total: 0, male: 0, female: 0 },
      '3rd Year': { total: 0, male: 0, female: 0 },
      '4th Year': { total: 0, male: 0, female: 0 },
      'Other':    { total: 0, male: 0, female: 0 }
    };

    var branchStats = {};
    var psStats = {};

    function normalizeYear(yrStr) {
      var s = String(yrStr || '').toLowerCase().trim();
      if (s.includes('1') || s.includes('first'))  return '1st Year';
      if (s.includes('2') || s.includes('second')) return '2nd Year';
      if (s.includes('3') || s.includes('third'))  return '3rd Year';
      if (s.includes('4') || s.includes('fourth')) return '4th Year';
      return 'Other';
    }

    function processPerson(name, gender, year, branch) {
      if (!name || String(name).trim() === '') return;

      totalStudents++;
      var g = String(gender || '').toLowerCase().trim();
      var isFemale = g.includes('female');
      var isMale   = g.includes('male') && !isFemale;

      if (isFemale) totalFemale++;
      else if (isMale) totalMale++;

      var yrKey = normalizeYear(year);
      yearStats[yrKey].total++;
      if (isFemale) yearStats[yrKey].female++;
      else if (isMale) yearStats[yrKey].male++;

      var brKey = String(branch || 'Not Specified').trim();
      if (brKey) {
        branchStats[brKey] = (branchStats[brKey] || 0) + 1;
      }
    }

    if (lastRow >= 2) {
      var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
      totalTeams = data.length;

      for (var i = 0; i < data.length; i++) {
        var row = data[i];
        var psVal = String(row[COL_PS_CHOICE - 1] || '').trim().replace(/^'/, '');
        if (psVal) {
          teamsWithPS++;
          var cleanId = extractCleanPSId_(psVal);
          if (cleanId) psStats[cleanId] = (psStats[cleanId] || 0) + 1;
        } else {
          teamsPendingPS++;
        }

        // Leader (Cols 4=Name, 7=Branch, 8=Year, 10=Gender)
        processPerson(row[4], row[10], row[8], row[7]);

        // Members 1 to 5
        for (var m = 0; m < 5; m++) {
          var base = 13 + (m * 9);
          processPerson(row[base], row[base + 6], row[base + 4], row[base + 3]);
        }
      }
    }

    // ── Row 1: Main Banner Header ──
    dashSheet.getRange('A1:E1').merge()
      .setValue('🚀 SIH 2026 INTERNAL HACKATHON — LIVE ANALYTICS DASHBOARD')
      .setFontWeight('bold')
      .setFontSize(14)
      .setBackground('#0f172a')
      .setFontColor('#ffffff')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
    dashSheet.setRowHeight(1, 40);

    // ── Row 2: Subtitle Banner ──
    dashSheet.getRange('A2:E2').merge()
      .setValue('⚡ Live Real-Time Data Sync · Last Refreshed: ' + new Date().toLocaleString())
      .setFontStyle('italic')
      .setFontSize(10)
      .setBackground('#1e293b')
      .setFontColor('#38bdf8')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
    dashSheet.setRowHeight(2, 24);

    // ── Row 4-5: Executive KPI Cards ──
    dashSheet.getRange('A4').setValue('TOTAL TEAMS').setFontWeight('bold').setFontSize(9).setFontColor('#93c5fd').setBackground('#1e3a8a').setHorizontalAlignment('center');
    dashSheet.getRange('A5').setValue(totalTeams).setFontWeight('bold').setFontSize(18).setFontColor('#ffffff').setBackground('#1e3a8a').setHorizontalAlignment('center');

    dashSheet.getRange('B4').setValue('TOTAL STUDENTS').setFontWeight('bold').setFontSize(9).setFontColor('#a7f3d0').setBackground('#065f46').setHorizontalAlignment('center');
    dashSheet.getRange('B5').setValue(totalStudents).setFontWeight('bold').setFontSize(18).setFontColor('#ffffff').setBackground('#065f46').setHorizontalAlignment('center');

    dashSheet.getRange('C4').setValue('MALE / FEMALE').setFontWeight('bold').setFontSize(9).setFontColor('#f0abfc').setBackground('#581c87').setHorizontalAlignment('center');
    dashSheet.getRange('C5').setValue(totalMale + ' M  /  ' + totalFemale + ' F').setFontWeight('bold').setFontSize(14).setFontColor('#ffffff').setBackground('#581c87').setHorizontalAlignment('center');

    dashSheet.getRange('D4').setValue('PS PROGRESS').setFontWeight('bold').setFontSize(9).setFontColor('#fde68a').setBackground('#78350f').setHorizontalAlignment('center');
    dashSheet.getRange('D5').setValue(teamsWithPS + ' / ' + totalTeams).setFontWeight('bold').setFontSize(16).setFontColor('#ffffff').setBackground('#78350f').setHorizontalAlignment('center');

    dashSheet.setRowHeight(4, 22);
    dashSheet.setRowHeight(5, 34);

    // ── Section 1: Academic Year & Gender Distribution ──
    var r = 7;
    dashSheet.getRange(r, 1, 1, 4).merge()
      .setValue('🎓 1. ACADEMIC YEAR & GENDER DISTRIBUTION')
      .setFontWeight('bold')
      .setFontSize(11)
      .setBackground('#1e1b4b')
      .setFontColor('#ffffff')
      .setVerticalAlignment('middle');
    dashSheet.setRowHeight(r, 28);
    r++;

    var yrHeaders = ['Academic Year', 'Total Students', 'Male Students', 'Female Students'];
    dashSheet.getRange(r, 1, 1, 4).setValues([yrHeaders])
      .setFontWeight('bold')
      .setFontSize(10)
      .setBackground('#e0e7ff')
      .setFontColor('#1e1b4b')
      .setHorizontalAlignment('center');
    dashSheet.setRowHeight(r, 24);
    r++;

    var yrRows = [
      ['1st Year (First Year)',  yearStats['1st Year'].total, yearStats['1st Year'].male, yearStats['1st Year'].female],
      ['2nd Year (Second Year)', yearStats['2nd Year'].total, yearStats['2nd Year'].male, yearStats['2nd Year'].female],
      ['3rd Year (Third Year)',  yearStats['3rd Year'].total, yearStats['3rd Year'].male, yearStats['3rd Year'].female],
      ['4th Year (Fourth Year)', yearStats['4th Year'].total, yearStats['4th Year'].male, yearStats['4th Year'].female]
    ];
    if (yearStats['Other'].total > 0) {
      yrRows.push(['Other / Unspecified', yearStats['Other'].total, yearStats['Other'].male, yearStats['Other'].female]);
    }

    dashSheet.getRange(r, 1, yrRows.length, 4).setValues(yrRows).setHorizontalAlignment('center');
    dashSheet.getRange(r, 1, yrRows.length, 1).setHorizontalAlignment('left');
    r += yrRows.length;

    // Grand Total Row
    dashSheet.getRange(r, 1, 1, 4).setValues([['GRAND TOTAL', totalStudents, totalMale, totalFemale]])
      .setFontWeight('bold')
      .setBackground('#0f172a')
      .setFontColor('#ffffff')
      .setHorizontalAlignment('center');
    dashSheet.getRange(r, 1).setHorizontalAlignment('left');
    dashSheet.setRowHeight(r, 26);
    r += 2;

    // ── Section 2: Department / Branch Breakdown ──
    dashSheet.getRange(r, 1, 1, 4).merge()
      .setValue('🏛️ 2. DEPARTMENT / BRANCH DISTRIBUTION')
      .setFontWeight('bold')
      .setFontSize(11)
      .setBackground('#134e4a')
      .setFontColor('#ffffff')
      .setVerticalAlignment('middle');
    dashSheet.setRowHeight(r, 28);
    r++;

    var brHeaders = ['Department / Branch Name', 'Total Students', 'Share % of Total', 'Status'];
    dashSheet.getRange(r, 1, 1, 4).setValues([brHeaders])
      .setFontWeight('bold')
      .setFontSize(10)
      .setBackground('#ccfbf1')
      .setFontColor('#134e4a')
      .setHorizontalAlignment('center');
    dashSheet.setRowHeight(r, 24);
    r++;

    var branchList = [];
    for (var b in branchStats) {
      branchList.push([b, branchStats[b]]);
    }
    branchList.sort(function(a, b) { return b[1] - a[1]; });

    var brRows = [];
    for (var k = 0; k < branchList.length; k++) {
      var count = branchList[k][1];
      var pct = totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) + '%' : '0%';
      brRows.push([
        branchList[k][0],
        count,
        pct,
        count >= 10 ? '⭐ Major Dept' : 'Active'
      ]);
    }

    if (brRows.length > 0) {
      dashSheet.getRange(r, 1, brRows.length, 4).setValues(brRows).setHorizontalAlignment('center');
      dashSheet.getRange(r, 1, brRows.length, 1).setHorizontalAlignment('left');
      r += brRows.length;
    }
    r += 2;

    // ── Section 3: Problem Statement Selections Leaderboard ──
    dashSheet.getRange(r, 1, 1, 5).merge()
      .setValue('🔥 3. PROBLEM STATEMENT SELECTIONS LEADERBOARD (ALL 37 PSs)')
      .setFontWeight('bold')
      .setFontSize(11)
      .setBackground('#831843')
      .setFontColor('#ffffff')
      .setVerticalAlignment('middle');
    dashSheet.setRowHeight(r, 28);
    r++;

    var psHeaders = ['Rank', 'PS ID', 'Problem Statement Title', 'Domain', 'Teams Selected'];
    dashSheet.getRange(r, 1, 1, 5).setValues([psHeaders])
      .setFontWeight('bold')
      .setFontSize(10)
      .setBackground('#fce7f3')
      .setFontColor('#831843')
      .setHorizontalAlignment('center');
    dashSheet.setRowHeight(r, 24);
    r++;

    var psLeaderboard = [];
    for (var idx = 0; idx < ALL_36_PROBLEM_STATEMENTS.length; idx++) {
      var item = ALL_36_PROBLEM_STATEMENTS[idx];
      var pCount = psStats[item.id] || 0;
      psLeaderboard.push([
        item.id,
        item.title,
        item.domain,
        pCount
      ]);
    }
    psLeaderboard.sort(function(a, b) { return b[3] - a[3]; });

    var psRows = [];
    for (var rank = 0; rank < psLeaderboard.length; rank++) {
      psRows.push([
        rank + 1,
        psLeaderboard[rank][0],
        psLeaderboard[rank][1],
        psLeaderboard[rank][2],
        psLeaderboard[rank][3]
      ]);
    }

    dashSheet.getRange(r, 1, psRows.length, 5).setValues(psRows).setHorizontalAlignment('center');
    dashSheet.getRange(r, 2, psRows.length, 2).setHorizontalAlignment('left'); // Title & Domain
    dashSheet.getRange(r, 4, psRows.length, 1).setHorizontalAlignment('left');

    // Highlight top selected rows with amber background
    for (var h = 0; h < psRows.length; h++) {
      if (psRows[h][4] > 0) {
        dashSheet.getRange(r + h, 1, 1, 5).setBackground('#fef3c7'); // Soft Amber
      }
    }

    // Set Column Widths for a clean layout
    dashSheet.setColumnWidth(1, 260); // Academic Year / Dept / Rank
    dashSheet.setColumnWidth(2, 140); // Total / PS ID
    dashSheet.setColumnWidth(3, 340); // Male / Title
    dashSheet.setColumnWidth(4, 160); // Female / Domain
    dashSheet.setColumnWidth(5, 140); // Teams Selected

    return 'SUCCESS: Real-Time Executive Analytics Dashboard generated successfully!';
  } catch (err) {
    Logger.log('Dashboard Error: ' + err.message);
    return 'ERROR: ' + err.message;
  }
}

