# LinguEd Landing Page

This is a clean responsive rebuild of the Claude design export. It does **not** depend on Claude's artifact runtime.

## Included

- Responsive desktop/mobile landing page matching the supplied design.
- Sticky navigation and all CTA buttons open the same full-screen assessment flow.
- Minimal three-step booking form.
- Validation for required fields, optional email, WhatsApp numbers, and appointment slots.
- A configurable availability picker that prevents arbitrary dates and times.
- Lead scoring: HOT / WARM / NURTURE / EARLY-STAGE.
- UTM/referrer/landing URL capture.
- Honeypot + minimum interaction-time spam trap.
- Google Apps Script collector that appends submissions to Google Sheets.
- Demo mode for testing before Google Sheets is connected.
- Original embedded LinguEd assets extracted from the Claude export.
- Outcome-led proof gallery with enlarged score reports, testimonials, and Google reviews.
- Continuous proof scrolling that pauses on hover, touch/click, keyboard focus, and while an image is enlarged.

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

## Appointment availability

The comparison branch uses example Tuesday, Thursday, and Saturday slots. Before launch, replace `AVAILABLE_WEEKDAYS` and `AVAILABLE_TIMES` in `config.js` with LinguEd's real schedule. Set `BOOKING_URL` to a Google Calendar Appointment Schedule or Cal.com booking page if live conflict checking is required.

## Lead qualification

The browser scores leads using urgency, target-score clarity, test selection, and appointment selection.

Current labels:

- 75–100: HOT
- 50–74: WARM
- 30–49: NURTURE
- 0–29: EARLY-STAGE

This scoring is easy to adjust in `qualificationScore()` inside `app.js` after LinguEd has real conversion data.

## Measurement hooks

The page pushes `form_started`, `form_step_completed`, `proof_opened`, and `assessment_requested` events to `window.dataLayer`. These can be connected to Google Analytics or another analytics service without changing the form.

## Deployment

This folder is static and can be deployed to Cloudflare Pages, GitHub Pages, Netlify, or any normal web host. No Node build step is required.
