# LinguEd Landing Page — Production Build v1

This is a clean responsive rebuild of the Claude design export. It does **not** depend on Claude's artifact runtime.

## Included

- Responsive desktop/mobile landing page matching the supplied design.
- Sticky navigation and all CTA buttons open the same full-screen assessment flow.
- Five-step conditional lead qualification form.
- Validation for required fields, email, WhatsApp numbers, dates and conditional answers.
- Hidden/dependent answers are cleared when the parent answer changes.
- Lead scoring: HOT / WARM / NURTURE / EARLY-STAGE.
- UTM/referrer/landing URL capture.
- Honeypot + minimum interaction-time spam trap.
- Google Apps Script collector that appends submissions to Google Sheets.
- Demo mode for testing before Google Sheets is connected.
- Original embedded LinguEd assets extracted from the Claude export.
- FAQ answers and several proof screenshots intentionally left as placeholders for later replacement.

## Test locally

The simplest option is to serve this folder with a local web server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

In demo mode, successful form submissions are stored in browser localStorage under:

`lingued_demo_leads`

## Connect Google Sheets

1. Create a Google Sheet for leads.
2. Open **Extensions → Apps Script**.
3. Paste the contents of `apps-script.gs`.
4. Replace `PASTE_YOUR_GOOGLE_SHEET_ID_HERE` with the ID from the Sheet URL.
5. Deploy as a **Web app** that executes as you and can be accessed by anyone.
6. Copy the Web App URL.
7. In `config.js`:
   - set `DEMO_MODE: false`
   - paste the URL into `APPS_SCRIPT_URL`.
8. Submit a test lead and confirm that a row appears in the `Leads` tab.

## Lead qualification

The browser scores leads using urgency, official-test booking, target-score clarity, starting-score clarity, decision-maker/funder identification, willingness to invest in preparation, and sponsor debrief availability.

Current labels:

- 75–100: HOT
- 50–74: WARM
- 30–49: NURTURE
- 0–29: EARLY-STAGE

This scoring is easy to adjust in `qualificationScore()` inside `app.js` after LinguEd has real conversion data.

## Replace later

### Proof screenshots

Files currently used:

- `assets/toefl-score.png`
- `assets/ielts-score.png`

Three other proof slots are placeholders in `index.html`. Replace those placeholder `<div>` elements with `<div class="proof-shot"><img ...></div>` when the final screenshots are available.

### FAQ answers

Edit `FAQ_DATA` near the top of `app.js`. The eight questions already match the Claude design. Replace `FAQ answer will be added here.` with the final answer for each question.

### Social links

The WhatsApp link is already live. Instagram and Facebook are intentionally prevented from navigating until the final URLs are supplied.

## Deployment

This folder is static and can be deployed to Cloudflare Pages, GitHub Pages, Netlify, or any normal web host. No Node build step is required.
