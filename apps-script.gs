/**
 * LinguEd lead collector for Google Sheets.
 *
 * SETUP
 * 1. Create a Google Sheet and copy its spreadsheet ID from the URL.
 * 2. Replace SPREADSHEET_ID below.
 * 3. Extensions > Apps Script, paste this file, save.
 * 4. Deploy > New deployment > Web app.
 * 5. Execute as: Me. Who has access: Anyone.
 * 6. Copy the Web App URL into config.js and set DEMO_MODE to false.
 */

const SPREADSHEET_ID = '';
const SHEET_NAME = 'Leads';

const HEADERS = [
  'Submitted At', 'Lead Status', 'Lead Score', 'Qualification Reasons',
  'Full Name', 'WhatsApp', 'Email', 'Booking For',
  'Test', 'Test Raw', 'Reason', 'Reason Raw', 'Timeline',
  'Taken Before', 'Prior Score', 'Target Score', 'Official Test Booked', 'Official Test Date',
  'Decision Maker', 'Funder', 'Openness', 'Sponsor WhatsApp', 'Sponsor Debrief',
  'Assessment Format', 'Preferred Date/Time',
  'UTM Source', 'UTM Medium', 'UTM Campaign', 'UTM Content', 'UTM Term',
  'Referrer', 'Landing URL', 'Form Version'
];

function doGet(e) {
  // Health check when no data param present.
  if (!e || !e.parameter || !e.parameter.data) {
    return json_({ ok: true, service: 'LinguEd lead collector' });
  }
  // Lead submission arrives as GET with ?data=<JSON> to avoid the Apps Script POST redirect bug.
  try {
    const payload = JSON.parse(e.parameter.data);
    validatePayload_(payload);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      let sheet = ss.getSheetByName(SHEET_NAME);
      if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
      ensureHeaders_(sheet);

      const row = [
        payload.submittedAt || new Date().toISOString(),
        safe_(payload.leadStatus), number_(payload.leadScore), safe_(payload.qualificationReasons),
        safe_(payload.fullName), safe_(payload.whatsapp), safe_(payload.email), safe_(payload.bookingFor),
        safe_(payload.testType), safe_(payload.testTypeRaw), safe_(payload.reason), safe_(payload.reasonRaw), safe_(payload.timeline),
        safe_(payload.takenBefore), safe_(payload.priorScore), safe_(payload.targetScore), safe_(payload.bookedOfficial), safe_(payload.testDate),
        safe_(payload.decisionMaker), safe_(payload.funder), safe_(payload.openness), safe_(payload.sponsorWhatsapp), safe_(payload.canJoinDebrief),
        safe_(payload.assessmentFormat), safe_(payload.preferredDateTime),
        safe_(payload.utmSource), safe_(payload.utmMedium), safe_(payload.utmCampaign), safe_(payload.utmContent), safe_(payload.utmTerm),
        safe_(payload.referrer), safe_(payload.landingUrl), safe_(payload.formVersion)
      ];
      sheet.appendRow(row);
      applyLeadFormatting_(sheet, sheet.getLastRow());
    } finally {
      lock.releaseLock();
    }
    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    validatePayload_(payload);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      let sheet = ss.getSheetByName(SHEET_NAME);
      if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
      ensureHeaders_(sheet);

      const row = [
        payload.submittedAt || new Date().toISOString(),
        safe_(payload.leadStatus), number_(payload.leadScore), safe_(payload.qualificationReasons),
        safe_(payload.fullName), safe_(payload.whatsapp), safe_(payload.email), safe_(payload.bookingFor),
        safe_(payload.testType), safe_(payload.testTypeRaw), safe_(payload.reason), safe_(payload.reasonRaw), safe_(payload.timeline),
        safe_(payload.takenBefore), safe_(payload.priorScore), safe_(payload.targetScore), safe_(payload.bookedOfficial), safe_(payload.testDate),
        safe_(payload.decisionMaker), safe_(payload.funder), safe_(payload.openness), safe_(payload.sponsorWhatsapp), safe_(payload.canJoinDebrief),
        safe_(payload.assessmentFormat), safe_(payload.preferredDateTime),
        safe_(payload.utmSource), safe_(payload.utmMedium), safe_(payload.utmCampaign), safe_(payload.utmContent), safe_(payload.utmTerm),
        safe_(payload.referrer), safe_(payload.landingUrl), safe_(payload.formVersion)
      ];
      sheet.appendRow(row);
      applyLeadFormatting_(sheet, sheet.getLastRow());
    } finally {
      lock.releaseLock();
    }

    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function validatePayload_(p) {
  if (!p.fullName || String(p.fullName).trim().length < 2) throw new Error('Missing full name');
  if (!p.whatsapp || String(p.whatsapp).replace(/\D/g, '').length < 9) throw new Error('Invalid WhatsApp number');
  if (!p.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(p.email))) throw new Error('Invalid email');
  if (!p.testType || !p.timeline || !p.assessmentFormat || !p.preferredDateTime) throw new Error('Missing required lead fields');
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.autoResizeColumns(1, HEADERS.length);
    return;
  }
  const existing = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (existing.join('|') !== HEADERS.join('|')) {
    throw new Error('Sheet headers do not match the expected LinguEd lead schema. Use a new sheet/tab or restore the headers.');
  }
}

function applyLeadFormatting_(sheet, row) {
  const status = String(sheet.getRange(row, 2).getValue() || '');
  const range = sheet.getRange(row, 1, 1, HEADERS.length);
  if (status === 'HOT') range.setFontWeight('bold');
}

function safe_(value) {
  const s = value == null ? '' : String(value);
  // Prevent spreadsheet formula injection from public form inputs.
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function number_(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
