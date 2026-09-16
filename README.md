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
- Google Apps Script collector that securely saves submissions to Notion.
- Demo mode for testing before Notion is connected.
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

## Connect Notion

1. Create a Notion integration with **Read content** and **Insert content** access and connect it to the `Test Readiness Leads` database.
2. Open the existing Google Apps Script project and replace its code with `apps-script.gs`.
3. In **Project Settings → Script Properties**, add `NOTION_TOKEN` with the integration secret as its value.
4. Run `testNotionConnection` once from the Apps Script editor and approve the requested permissions. Its execution log should show `ok: true` and the database property names.
5. Deploy a new Web app version that executes as you and can be accessed by anyone.
6. Copy its `/exec` URL into `APPS_SCRIPT_URL` in `config.js` and keep `DEMO_MODE: false`.
7. Open the `/exec` URL directly. It should report `configured: true`.
8. Submit a test lead and confirm that a new page appears in the Notion database.

The database ID is already configured in `apps-script.gs`. The collector discovers its current Notion data-source ID automatically. Never place the Notion token in this repository or in browser-side code.

## Appointment availability

The final booking step uses LinguEd's Google Calendar Appointment Schedule. Google Calendar controls real availability, blocks conflicts, and confirms the selected appointment. `BOOKING_URL` and `BOOKING_EMBED_URL` are configured in `config.js`.

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
