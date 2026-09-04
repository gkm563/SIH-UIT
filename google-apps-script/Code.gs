/**
 * =============================================================================
 * Smart India Hackathon (SIH) 2026 – Official Certificate Engine & Backend
 * United Institute of Technology (UIT), Prayagraj
 * Lead Student Coordinator & Architect: Gautam Kumar Maurya (GKM)
 * =============================================================================
 * 
 * Purpose:
 * 1. Automatically generate personalized PDF certificates from Google Slides template.
 * 2. Send official congratulations HTML emails with PDF attachment directly from sihuit2026@gmail.com.
 * 3. Track sent/pending statuses and live delivery metrics.
 * 4. Serve certificate verification requests (doGet).
 * =============================================================================
 */

// Bound spreadsheet ID
const SPREADSHEET_ID = '1vbDZMAJJgZpELJpfGtdPCres5puMHxe3ac4vvLIoNbs';

// Google Slides Certificate Template ID
const CERTIFICATE_TEMPLATE_SLIDE_ID = '1qheLVRQxgpfVqAoC4v2Ce0JblKYGAP2_mYHZJi2PsCA';

// Drive folder name for generated certificates
const CERTIFICATES_FOLDER_NAME = 'SIH 2026 Certificates Archive';

/**
 * Creates custom "🎓 SIH 2026 Certificate Tools" menu in Google Sheets
 */
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('🎓 SIH 2026 Certificate Tools')
      .addItem('🧪 Send 1 Test Certificate to GKM (gkmwin563@gmail.com)', 'SEND_TEST_CERTIFICATE')
      .addItem('🚀 Send All Pending Certificates (Auto-Email)', 'SEND_ALL_PENDING_CERTIFICATES')
      .addSeparator()
      .addItem('📈 Refresh Certificate Statistics', 'REFRESH_CERTIFICATE_STATS')
      .addToUi();
  } catch (e) {}
}

/**
 * 🧪 TEST FUNCTION: Sends 1 sample certificate to gkmwin563@gmail.com
 * Use this to verify formatting, alignment, and email delivery before sending to all 402 students.
 */
function SEND_TEST_CERTIFICATE() {
  var ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Certificates');
  var ui = SpreadsheetApp.getUi();

  if (!sheet) {
    ui.alert('Error', 'Could not find "Certificates" tab in this spreadsheet.', ui.ButtonSet.OK);
    return;
  }

  var currentSender = Session.getActiveUser().getEmail();
  if (currentSender.toLowerCase() !== 'sihuit2026@gmail.com') {
    var proceed = ui.alert(
      '⚠️ Sender Warning',
      'You are currently running as: ' + currentSender + '\n\n' +
      'To send from "sihuit2026@gmail.com", please open this sheet in your "sihuit2026@gmail.com" Chrome profile.\n\n' +
      'Do you still want to proceed and send test email from ' + currentSender + '?',
      ui.ButtonSet.YES_NO
    );
    if (proceed !== ui.Button.YES) return;
  }

  var testEmail = 'gkmwin563@gmail.com';
  
  // Sample Data from Row 6 (first student: Riya Gupta - THE PRISM)
  var sampleCertId = sheet.getRange('A6').getValue() || 'SIH-UIT-2026-001';
  var sampleName = sheet.getRange('C6').getValue() || 'Riya Gupta';
  var sampleTeam = sheet.getRange('E6').getValue() || 'THE PRISM';
  var sampleRole = sheet.getRange('F6').getValue() || 'Team Leader';

  try {
    var certResult = generateCertificatePdf_(CERTIFICATE_TEMPLATE_SLIDE_ID, sampleCertId, sampleName, sampleTeam);
    
    sendCertificateEmail_(testEmail, sampleName, sampleTeam, sampleCertId, sampleRole, certResult.blob, certResult.driveUrl);

    ui.alert(
      '✅ Test Certificate Sent!', 
      'A test certificate for "' + sampleName + '" (' + sampleCertId + ') has been sent to ' + testEmail + '.\n\n' +
      '• Google Drive File Link:\n' + certResult.driveUrl + '\n\n' +
      'Please check your inbox (' + testEmail + ') to review the email formatting, buttons, and PDF attachment.', 
      ui.ButtonSet.OK
    );
  } catch (err) {
    ui.alert(
      '❌ Error Generating Certificate', 
      'Error: ' + err.message + '\n\nPlease ensure CERTIFICATE_TEMPLATE_SLIDE_ID is valid and shared with edit permissions.', 
      ui.ButtonSet.OK
    );
  }
}

/**
 * 🚀 MAIN AUTOMATION: Sends personalized certificates to all students with status "Pending"
 * Automatically tracks progress, updates status to "Sent", and updates top dashboard stats.
 */
function SEND_ALL_PENDING_CERTIFICATES() {
  var ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Certificates');
  var ui = SpreadsheetApp.getUi();

  if (!sheet) {
    ui.alert('Error', 'Could not find "Certificates" tab.', ui.ButtonSet.OK);
    return;
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < 6) {
    ui.alert('Info', 'No certificate records found below row 5.', ui.ButtonSet.OK);
    return;
  }

  // Confirm with Admin
  var confirm = ui.alert(
    '🎓 Confirm Certificate Dispatch',
    'Are you sure you want to generate and email certificates to all PENDING participants in the "Certificates" tab?\n\n' +
    '• Email Sender: ' + Session.getActiveUser().getEmail() + '\n' +
    '• Daily Gmail Quota Remaining: ' + MailApp.getRemainingDailyQuota() + ' emails',
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) return;

  var dataRange = sheet.getRange(6, 1, lastRow - 5, 7); // Cols A to G
  var data = dataRange.getValues();

  var sentCount = 0;
  var skippedCount = 0;
  var errorCount = 0;

  var tempFolder = getOrCreateCertificatesFolder_();

  for (var i = 0; i < data.length; i++) {
    var rowNum = 6 + i;
    var certId = data[i][0];       // Col A
    var regId = data[i][1];        // Col B
    var name = data[i][2];         // Col C
    var email = data[i][3];        // Col D
    var teamName = data[i][4];     // Col E
    var role = data[i][5];         // Col F
    var status = String(data[i][6]).toLowerCase().trim(); // Col G

    // Skip if already sent
    if (status.indexOf('sent') !== -1) {
      skippedCount++;
      continue;
    }

    // Check remaining email quota
    if (MailApp.getRemainingDailyQuota() <= 0) {
      ui.alert(
        '⚠️ Daily Quota Limit Reached',
        'Daily email quota has been exhausted. Sent: ' + sentCount + ' certificates.\n\n' +
        'Remaining pending rows are preserved. Simply run this function again tomorrow to resume automatically!',
        ui.ButtonSet.OK
      );
      break;
    }

    if (!email || email.indexOf('@') === -1) {
      sheet.getRange(rowNum, 7).setValue('Error: Invalid Email').setBackground('#fee2e2');
      errorCount++;
      continue;
    }

    try {
      // 1. Generate personalized PDF Certificate & Save to Drive
      var certResult = generateCertificatePdf_(CERTIFICATE_TEMPLATE_SLIDE_ID, certId, name, teamName, tempFolder);

      // 2. Send Official Email with Drive Link and Verification URL
      sendCertificateEmail_(email, name, teamName, certId, role, certResult.blob, certResult.driveUrl);

      // 3. Mark as Sent in Sheet (Col G) & Record Drive Link (Col H)
      var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MMM hh:mm a");
      sheet.getRange(rowNum, 7).setValue('Sent (' + timestamp + ')').setBackground('#dcfce7').setFontColor('#166534');
      try {
        sheet.getRange(rowNum, 8).setValue(certResult.driveUrl);
      } catch (eColH) {}

      sentCount++;

      // Small pause to prevent rate-limiting
      Utilities.sleep(1200);

    } catch (e) {
      Logger.log('Error row ' + rowNum + ' (' + name + '): ' + e.message);
      sheet.getRange(rowNum, 7).setValue('Error: ' + e.message.substring(0, 30)).setBackground('#fee2e2');
      errorCount++;
    }
  }

  // Refresh Top Stats Counters (Cells A2, B2, C2, D2)
  REFRESH_CERTIFICATE_STATS();

  ui.alert(
    '🎉 Certificate Dispatch Batch Complete!',
    'Summary:\n' +
    '• Successfully Sent: ' + sentCount + '\n' +
    '• Previously Sent (Skipped): ' + skippedCount + '\n' +
    '• Errors: ' + errorCount + '\n' +
    '• Remaining Daily Email Quota: ' + MailApp.getRemainingDailyQuota(),
    ui.ButtonSet.OK
  );
}

/**
 * Generates a PDF Certificate by replacing placeholders in Google Slides template
 */
/**
 * Helper to get template file with automatic Drive search fallback
 */
function getTemplateFile_(slideTemplateId) {
  var cleanId = String(slideTemplateId || '').trim();
  var urlMatch = cleanId.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (urlMatch && urlMatch[1]) {
    cleanId = urlMatch[1];
  }

  // 1. Try exact cleanId
  if (cleanId && cleanId.indexOf('YOUR_') === -1) {
    try {
      return DriveApp.getFileById(cleanId);
    } catch (e1) {}

    // 2. Try swapping '_' with '-' and vice-versa
    try {
      var altId = cleanId.indexOf('_') !== -1 ? cleanId.replace(/_/g, '-') : cleanId.replace(/-/g, '_');
      return DriveApp.getFileById(altId);
    } catch (e2) {}
  }

  // 3. Search user's Drive automatically for presentation named "SIH"
  try {
    var files = DriveApp.getFilesByName('SIH');
    while (files.hasNext()) {
      var f = files.next();
      if (f.getMimeType() === MimeType.GOOGLE_SLIDES || f.getMimeType() === 'application/vnd.google-apps.presentation') {
        Logger.log('Auto-discovered SIH Google Slide template! ID: ' + f.getId());
        return f;
      }
    }
  } catch (e3) {}

  // 4. Search all Google Slides in Drive for any with "sih" in title
  try {
    var allPres = DriveApp.getFilesByType(MimeType.GOOGLE_SLIDES);
    while (allPres.hasNext()) {
      var p = allPres.next();
      var pName = p.getName().toLowerCase();
      if (pName.indexOf('sih') !== -1 || pName.indexOf('cert') !== -1) {
        Logger.log('Auto-found presentation: ' + p.getName() + ' (ID: ' + p.getId() + ')');
        return p;
      }
    }
  } catch (e4) {}

  throw new Error('Google Slides template could not be found.\n\nPlease click "Copy link" in your Google Slide Share modal and paste that link into CERTIFICATE_TEMPLATE_SLIDE_ID.');
}

/**
 * Generates a PDF Certificate by replacing placeholders in Google Slides template
 */
function generateCertificatePdf_(slideTemplateId, certId, participantName, teamName, folder) {
  var targetFolder = folder || getOrCreateCertificatesFolder_();
  var templateFile = getTemplateFile_(slideTemplateId);

  // 1. Make a temporary copy of the slide template
  var copyFile = templateFile.makeCopy('Temp_Cert_' + certId, targetFolder);
  var copySlide = SlidesApp.openById(copyFile.getId());

  // 2. Replace placeholders in all slides (handles all tag formats & spaces)
  var slides = copySlide.getSlides();
  for (var s = 0; s < slides.length; s++) {
    // Certificate ID tags
    slides[s].replaceAllText('{{CertificateID}}', String(certId || ''));
    slides[s].replaceAllText('{{ CertificateID }}', String(certId || ''));
    slides[s].replaceAllText('{{CertID}}', String(certId || ''));
    slides[s].replaceAllText('{{ CertID }}', String(certId || ''));
    slides[s].replaceAllText('{{Certificate ID}}', String(certId || ''));
    slides[s].replaceAllText('{{ Certificate ID }}', String(certId || ''));
    
    // Participant Name tags
    slides[s].replaceAllText('{{ParticipantName}}', String(participantName || ''));
    slides[s].replaceAllText('{{ ParticipantName }}', String(participantName || ''));
    slides[s].replaceAllText('{{Name}}', String(participantName || ''));
    slides[s].replaceAllText('{{ Name }}', String(participantName || ''));
    slides[s].replaceAllText('{{Participant Name}}', String(participantName || ''));
    slides[s].replaceAllText('{{ Participant Name }}', String(participantName || ''));
    
    // Team Name tags
    slides[s].replaceAllText('{{TeamName}}', String(teamName || ''));
    slides[s].replaceAllText('{{ Team Name }}', String(teamName || ''));
    slides[s].replaceAllText('{{Team}}', String(teamName || ''));
    slides[s].replaceAllText('{{ Team }}', String(teamName || ''));
    slides[s].replaceAllText('{{Team Name}}', String(teamName || ''));
    slides[s].replaceAllText('{{ Team Name }}', String(teamName || ''));
  }

  copySlide.saveAndClose();

  // 3. Export as high-quality PDF
  var pdfBlob = copyFile.getAs('application/pdf');
  var cleanFileName = 'SIH2026_Certificate_' + String(participantName).replace(/[^a-zA-Z0-9]/g, '_') + '_' + certId + '.pdf';
  pdfBlob.setName(cleanFileName);

  // 4. Save PDF to Certificates Drive folder with Public View access
  var certPdfFile = targetFolder.createFile(pdfBlob);
  try {
    certPdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (eShare) {
    Logger.log('Note on file sharing permission: ' + eShare.message);
  }
  var driveViewUrl = certPdfFile.getUrl();

  // 5. Delete the temporary slide file
  copyFile.setTrashed(true);

  return {
    blob: pdfBlob,
    driveUrl: driveViewUrl,
    fileId: certPdfFile.getId()
  };
}

/**
 * Sends a high-impact, professional HTML email with the certificate attached
 */
function sendCertificateEmail_(recipientEmail, participantName, teamName, certId, role, pdfData, explicitDriveUrl) {
  var cleanName = String(participantName || 'Participant').trim();
  var cleanTeam = String(teamName || 'Innovation Team').trim();
  var cleanCertId = String(certId || 'SIH-UIT-2026-XXX').trim();
  var cleanRole = String(role || 'Team Member').trim();

  // Extract PDF attachment blob and Drive URL
  var pdfAttachment = pdfData;
  var driveFileUrl = explicitDriveUrl || '';

  if (pdfData && pdfData.blob) {
    pdfAttachment = pdfData.blob;
    driveFileUrl = pdfData.driveUrl || explicitDriveUrl || '';
  }

  // Official verification URL on live website
  var verifyUrl = 'https://sih-uit.vercel.app/verify.html?cert=' + encodeURIComponent(cleanCertId);
  var downloadUrl = driveFileUrl || verifyUrl;

  // Clean, professional subject line
  var subject = 'Official Certificate of Participation - ' + cleanName + ' (Team ' + cleanTeam + ') | SIH 2026 UIT Prayagraj';

  var htmlBody = 
    "<div style='font-family: Arial, Helvetica, sans-serif; max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);'>" +
      // Header Banner
      "<div style='background: linear-gradient(135deg,#0d2344 0%,#1e3a8a 60%,#0f172a 100%); padding: 36px 24px; text-align: center; color: #ffffff;'>" +
        "<div style='display: inline-block; background: rgba(255,255,255,0.12); padding: 5px 16px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.25);'>" +
          "United Institute of Technology, Prayagraj" +
        "</div>" +
        "<h1 style='margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; line-height: 1.3;'>" +
          "Smart India Hackathon 2026" +
        "</h1>" +
        "<p style='margin: 6px 0 0; font-size: 13px; color: #93c5fd; font-weight: 600;'>" +
          "College-Level Internal Hackathon &middot; 22 August 2026" +
        "</p>" +
      "</div>" +

      // Body Content
      "<div style='padding: 32px 28px; color: #334155; line-height: 1.7; font-size: 14px;'>" +
        "<p style='font-size: 17px; margin: 0 0 16px; color: #0f172a;'>" +
          "Dear <strong>" + cleanName + "</strong>," +
        "</p>" +
        "<p style='margin: 0 0 16px; font-size: 15px; color: #0f172a; font-weight: 600;'>" +
          "🎉 <strong>Heartiest Congratulations on your Participation &amp; Technical Achievement!</strong>" +
        "</p>" +
        "<p style='margin: 0 0 16px;'>" +
          "We take immense pleasure in awarding you the official <strong>Certificate of Participation</strong> for successfully presenting and demonstrating your technical solution in the <strong>Smart India Hackathon 2026 Internal Hackathon</strong>, organized at United Institute of Technology, Prayagraj on <strong>22 August 2026</strong>." +
        "</p>" +
        "<p style='margin: 0 0 20px;'>" +
          "Your technical competence, creative problem-solving, and dedication as <strong>" + cleanRole + "</strong> representing team <strong>\"" + cleanTeam + "\"</strong> contributed significantly to the high standard of innovation showcased during the institutional evaluations." +
        "</p>" +

        // Certificate Details Card
        "<div style='background: linear-gradient(135deg,#f8fafc 0%,#eff6ff 100%); border: 2px solid #bfdbfe; border-radius: 14px; padding: 22px 20px; margin: 24px 0; text-align: center; box-shadow: 0 2px 8px rgba(30,58,138,0.06);'>" +
          "<div style='font-size: 11px; font-weight: 800; color: #1e40af; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;'>" +
            "Official Credential ID" +
          "</div>" +
          "<div style='font-size: 22px; font-weight: 900; color: #1e3a8a; font-family: monospace; letter-spacing: 1.5px; background: #ffffff; display: inline-block; padding: 7px 20px; border-radius: 8px; border: 1px solid #93c5fd; box-shadow: 0 1px 3px rgba(0,0,0,0.05);'>" +
            cleanCertId +
          "</div>" +
          "<div style='font-size: 13px; color: #334155; margin-top: 12px; font-weight: 600; line-height: 1.6;'>" +
            "Awarded to: <strong style='color: #0f172a;'>" + cleanName + "</strong> (" + cleanRole + ")<br>" +
            "Team: <strong style='color: #2563eb;'>" + cleanTeam + "</strong> &middot; Status: <span style='color: #059669; font-weight: 800;'>Authenticated &amp; Issued</span>" +
          "</div>" +
        "</div>" +

        "<p style='margin: 0 0 16px;'>" +
          "You can directly access, view, download, or verify your credential using the official links below:" +
        "</p>" +

        // Dual Action Buttons: 1 for Google Drive Download/View, 1 for Website Verification
        "<div style='text-align: center; margin: 26px 0;'>" +
          "<a href='" + downloadUrl + "' target='_blank' style='display: inline-block; background: linear-gradient(135deg,#0d2344,#1e3a8a); color: #ffffff; text-decoration: none; padding: 13px 24px; border-radius: 12px; font-weight: 800; font-size: 13px; margin: 6px 4px; box-shadow: 0 4px 14px rgba(13,35,68,0.25);'>" +
            "📥 Download / View Certificate" +
          "</a>" +
          "<a href='" + verifyUrl + "' target='_blank' style='display: inline-block; background: linear-gradient(135deg,#059669,#047857); color: #ffffff; text-decoration: none; padding: 13px 24px; border-radius: 12px; font-weight: 800; font-size: 13px; margin: 6px 4px; box-shadow: 0 4px 14px rgba(5,150,105,0.25);'>" +
            "✓ Verify Certificate Here" +
          "</a>" +
        "</div>" +

        "<p style='margin: 0 0 12px; font-size: 13px; color: #64748b; background: #f8fafc; padding: 12px 16px; border-radius: 10px; border-left: 4px solid #3b82f6;'>" +
          "📎 <strong>Attachment:</strong> A high-resolution, print-ready PDF certificate is also attached directly to this email for your permanent academic portfolio." +
        "</p>" +

        "<p style='margin: 18px 0 0; font-size: 13px; color: #475569;'>" +
          "We commend your innovative spirit and wish you and team <strong>\"" + cleanTeam + "\"</strong> immense success in all future national hackathons and technical endeavors! 🚀" +
        "</p>" +
      "</div>" +

      // Institutional Footer
      "<div style='background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 24px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5;'>" +
        "<strong style='color: #0f172a; display: block; font-size: 13px; margin-bottom: 4px;'>Internal Hackathon Organizing Committee</strong>" +
        "Department of Computer Science &amp; Engineering<br>" +
        "United Institute of Technology, Prayagraj &middot; Smart India Hackathon 2026<br>" +
        "Official Portal: <a href='https://sih-uit.vercel.app' style='color: #2563eb; font-weight: 700; text-decoration: none;'>sih-uit.vercel.app</a>" +
      "</div>" +
    "</div>";

  GmailApp.sendEmail(recipientEmail, subject, "Please view this email in an HTML-compatible client.", {
    htmlBody: htmlBody,
    name: 'Smart India Hackathon 2026 | UIT Prayagraj',
    replyTo: 'sihuit2026@gmail.com',
    attachments: [pdfAttachment]
  });
}

/**
 * Refreshes top statistics box in Certificates sheet (Cells A2, B2, C2, D2)
 */
function REFRESH_CERTIFICATE_STATS() {
  var ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Certificates');
  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  if (lastRow < 6) return;

  var statuses = sheet.getRange(6, 7, lastRow - 5, 1).getValues();
  var total = statuses.length;
  var sent = 0;

  for (var i = 0; i < total; i++) {
    if (String(statuses[i][0]).toLowerCase().indexOf('sent') !== -1) {
      sent++;
    }
  }

  var pending = total - sent;
  var completionRate = total > 0 ? (sent / total) : 0;

  sheet.getRange('A2').setValue(total);
  sheet.getRange('B2').setValue(pending);
  sheet.getRange('C2').setValue(sent);
  sheet.getRange('D2').setValue(completionRate);
}

/**
 * Helper to get or create Drive folder for certificates
 */
function getOrCreateCertificatesFolder_() {
  var folders = DriveApp.getFoldersByName(CERTIFICATES_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(CERTIFICATES_FOLDER_NAME);
}

/**
 * Web App Endpoint (doGet) - Optional Certificate Verification & Status API
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';
  if (action === 'verifyCertificate') {
    var certId = (e.parameter.certId || '').trim();
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Certificates');
    if (sheet && certId) {
      var data = sheet.getDataRange().getValues();
      for (var i = 5; i < data.length; i++) {
        if (String(data[i][0]).trim().toUpperCase() === certId.toUpperCase()) {
          return ContentService.createTextOutput(JSON.stringify({
            success: true,
            certificate: {
              certId: data[i][0],
              regId: data[i][1],
              name: data[i][2],
              teamName: data[i][4],
              role: data[i][5],
              status: data[i][6]
            }
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Certificate not found' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: 'ONLINE',
    system: 'SIH 2026 Certificate Dispatch & Verification Service',
    institution: 'United Institute of Technology, Prayagraj',
    leadArchitect: 'Gautam Kumar Maurya (GKM)'
  })).setMimeType(ContentService.MimeType.JSON);
}
