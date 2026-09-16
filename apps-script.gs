/**
 * LinguEd Notion-only lead collector.
 *
 * SETUP
 * 1. Give the Notion integration Read content and Insert content capabilities.
 * 2. In Apps Script > Project Settings > Script Properties, add:
 *      NOTION_TOKEN = your Notion integration secret
 * 3. Connect the integration to the Notion database.
 * 4. Deploy as a Web app: Execute as Me; Who has access: Anyone.
 * 5. Keep the resulting /exec URL in config.js as APPS_SCRIPT_URL.
 */

const NOTION_DATABASE_ID = '3ddc2bf00bc88034b3a6ec14a802b187';
const NOTION_VERSION = '2025-09-03';

function doGet(e) {
  if (!e || !e.parameter || !e.parameter.data) {
    return json_({ ok: true, service: 'LinguEd Notion lead collector', configured: Boolean(getNotionToken_()) });
  }
  try {
    return handleLead_(JSON.parse(e.parameter.data));
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return json_({ ok: false, error: 'The lead could not be saved.' });
  }
}

function doPost(e) {
  try {
    return handleLead_(JSON.parse((e && e.postData && e.postData.contents) || '{}'));
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return json_({ ok: false, error: 'The lead could not be saved.' });
  }
}

function handleLead_(payload) {
  validatePayload_(payload);
  const token = getNotionToken_();
  if (!token) throw new Error('Missing NOTION_TOKEN Script Property.');

  const dataSourceId = getDataSourceId_(token);
  const dataSource = notionRequest_('get', '/v1/data_sources/' + dataSourceId, token);
  const schema = dataSource.properties || {};
  const properties = {};

  addProperty_(properties, schema, 'Name', payload.fullName);
  addProperty_(properties, schema, 'Submitted', payload.submittedAt || new Date().toISOString());
  addProperty_(properties, schema, 'WhatsApp', payload.whatsapp);
  addProperty_(properties, schema, 'Email', payload.email);
  addProperty_(properties, schema, 'Test', payload.testType);
  addProperty_(properties, schema, 'Target Score', payload.targetScore);
  addProperty_(properties, schema, 'Deadline', payload.timeline);
  addProperty_(properties, schema, 'Booking For', payload.bookingFor);
  addProperty_(properties, schema, 'Assessment Format', payload.assessmentFormat);
  addProperty_(properties, schema, 'Booking Stage', 'Calendar opened');
  addProperty_(properties, schema, 'Lead Status', payload.leadStatus);
  addProperty_(properties, schema, 'Lead Score', payload.leadScore);
  addProperty_(properties, schema, 'Source', sourceLabel_(payload));

  if (!properties.Name) throw new Error('The Notion database needs a title property named "Name".');

  const page = notionRequest_('post', '/v1/pages', token, {
    parent: { type: 'data_source_id', data_source_id: dataSourceId },
    properties: properties
  });
  return json_({ ok: true, notionPageId: page.id });
}

function getNotionToken_() {
  return PropertiesService.getScriptProperties().getProperty('NOTION_TOKEN') || '';
}

function testNotionConnection() {
  const token = getNotionToken_();
  if (!token) throw new Error('Missing NOTION_TOKEN Script Property.');
  const dataSourceId = getDataSourceId_(token);
  const dataSource = notionRequest_('get', '/v1/data_sources/' + dataSourceId, token);
  const result = { ok: true, dataSourceId: dataSourceId, properties: Object.keys(dataSource.properties || {}) };
  console.log(JSON.stringify(result));
  return result;
}

function testLeadSubmission() {
  const testPayload = {
    submittedAt: new Date().toISOString(),
    fullName: 'LinguEd Diagnostic Test',
    whatsapp: '+250700000000',
    email: '',
    bookingFor: 'Myself',
    testType: 'TOEFL',
    targetScore: 'Diagnostic only',
    timeline: 'In 1–3 months',
    assessmentFormat: 'Online via Google Meet',
    leadStatus: 'WARM',
    leadScore: 50,
    utmSource: 'Apps Script diagnostic'
  };

  const response = handleLead_(testPayload);
  const result = JSON.parse(response.getContent());
  console.log(JSON.stringify(result));
  return result;
}

function getDataSourceId_(token) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('NOTION_DATA_SOURCE_ID');
  if (cached) return cached;

  const database = notionRequest_('get', '/v1/databases/' + NOTION_DATABASE_ID, token);
  const sources = database.data_sources || [];
  if (!sources.length || !sources[0].id) throw new Error('No data source was found in the connected Notion database.');

  cache.put('NOTION_DATA_SOURCE_ID', sources[0].id, 21600);
  return sources[0].id;
}

function notionRequest_(method, path, token, body) {
  const options = {
    method: method,
    muteHttpExceptions: true,
    headers: {
      Authorization: 'Bearer ' + token,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json'
    }
  };
  if (body) options.payload = JSON.stringify(body);

  const response = UrlFetchApp.fetch('https://api.notion.com' + path, options);
  const status = response.getResponseCode();
  const text = response.getContentText();
  let result = {};
  try { result = text ? JSON.parse(text) : {}; } catch (_) { result = {}; }
  if (status < 200 || status >= 300) {
    throw new Error('Notion API ' + status + ': ' + (result.message || text || 'Unknown error'));
  }
  return result;
}

function addProperty_(output, schema, name, value) {
  if (value === null || value === undefined || value === '') return;
  const definition = schema[name];
  if (!definition || !definition.type) return;

  const stringValue = String(value);
  switch (definition.type) {
    case 'title':
      output[name] = { title: [{ text: { content: stringValue.slice(0, 2000) } }] };
      break;
    case 'rich_text':
      output[name] = { rich_text: [{ text: { content: stringValue.slice(0, 2000) } }] };
      break;
    case 'phone_number':
      output[name] = { phone_number: stringValue };
      break;
    case 'email':
      output[name] = { email: stringValue };
      break;
    case 'date':
      output[name] = { date: { start: new Date(value).toISOString() } };
      break;
    case 'select':
      output[name] = { select: { name: stringValue.slice(0, 100) } };
      break;
    case 'status':
      output[name] = { status: { name: stringValue.slice(0, 100) } };
      break;
    case 'number':
      output[name] = { number: Number(value) || 0 };
      break;
    case 'url':
      output[name] = { url: stringValue };
      break;
  }
}

function sourceLabel_(payload) {
  const campaign = [payload.utmSource, payload.utmMedium, payload.utmCampaign].filter(Boolean).join(' / ');
  if (campaign) return campaign;
  if (payload.referrer) return payload.referrer;
  return 'LinguEd website';
}

function validatePayload_(payload) {
  if (!payload || !payload.fullName || String(payload.fullName).trim().length < 2) throw new Error('Missing name.');
  if (!payload.whatsapp || String(payload.whatsapp).replace(/\D/g, '').length < 9) throw new Error('Invalid WhatsApp number.');
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.email))) throw new Error('Invalid email.');
  if (!payload.testType || !payload.timeline || !payload.assessmentFormat) throw new Error('Missing required lead fields.');
}

function json_(object) {
  return ContentService.createTextOutput(JSON.stringify(object)).setMimeType(ContentService.MimeType.JSON);
}
