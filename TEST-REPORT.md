# LinguEd Landing Page v1 — Browser Test Report

Tested in headless Chromium using the production HTML/CSS/JS logic.

## Passed

- JavaScript syntax checks for `app.js`, `config.js`, and the Apps Script collector.
- Desktop render at 1440px.
- Mobile render at 390px.
- Responsive overflow checks at 320px, 390px, 768px, 1024px, and 1440px: no page-level horizontal overflow.
- All three CTA buttons are wired to the same assessment flow.
- Empty Step 1 cannot proceed and displays validation errors.
- Step 1 contact data persists when moving forward/back.
- `Other` test condition shows the extra input and clears its stale value when another test is selected.
- Prior score is conditional on having taken the test before.
- Official test date is conditional on having booked the official test.
- Sponsor/parent fields are conditional on sponsor involvement.
- Final confirmation checkbox gates submission.
- Completed form reaches the success screen.
- Qualification test lead produced `HOT` with score 99/100.
- UTM/referrer/landing URL fields are present in the submission payload.
- Escape key closes the modal.
- FAQ accordions open/close.
- No JavaScript page errors were detected in desktop/mobile browser passes.

## Not live-tested yet

- Real Google Sheets write: the Apps Script endpoint still needs to be deployed and pasted into `config.js`.
- Final Instagram/Facebook links: URLs not yet supplied.
- Final FAQ copy and proof screenshots: intentionally left as placeholders.
