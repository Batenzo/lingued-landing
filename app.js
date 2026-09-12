(() => {
  'use strict';

  const CONFIG = window.LINGUED_CONFIG || {};
  const TEST_OPTIONS = ['TOEFL', 'IELTS', 'SAT', 'ACT', 'GRE', 'TEF', 'Not sure yet', 'Other'];
  const TIMELINE_OPTIONS = ['Within 30 days', 'In 1–3 months', 'In 3–6 months', 'More than 6 months from now', "I'm not sure yet"];
  const BOOKING_FOR_OPTIONS = ['Myself', 'My child', 'Someone else'];
  const FORMAT_DATA = [
    { label: 'In-person at LinguEd Center, Kigali', helper: 'Recommended for students in Kigali.' },
    { label: 'Online via Google Meet', helper: 'Available depending on your test, location, and situation.' }
  ];
  const FAQ_DATA = [
    {
      q: 'What happens in the Test Readiness Assessment?',
      a: [
        'You complete a test-specific readiness check based on the exam you are preparing for, such as TOEFL, IELTS, SAT, GRE, or ACT.',
        'Depending on your test, we may review reading, listening, writing, speaking, timing, and test strategy.',
        'At the end, we explain your current level, your score gap, your weak areas, and the recommended next step before your official test.'
      ]
    },
    {
      q: 'Is the assessment really free?',
      a: [
        'Yes. The Test Readiness Assessment is free.',
        'If preparation is recommended after the assessment, our preparation programs are paid separately. You are not required to enroll after the assessment.'
      ]
    },
    {
      q: 'Who is this assessment for?',
      a: [
        'This assessment is for students preparing for international tests such as TOEFL, IELTS, SAT, GRE, or ACT, especially if they need a score for university admission, scholarships, immigration, or another international opportunity.',
        'It is also useful for parents who want to know whether their child is ready before paying for the official test or preparation.'
      ]
    },
    {
      q: 'Why should I do an assessment before preparing or registering for the official test?',
      a: [
        'Many students do not know their current level before they register for the official test or start studying.',
        'The assessment helps you understand whether your current level is close to your target score, which sections are weak, and how much preparation may be needed before your deadline.'
      ]
    },
    {
      q: 'Do you offer preparation programs after the assessment?',
      a: [
        'Yes. LinguEd offers structured preparation programs for TOEFL, IELTS, SAT, GRE, ACT, and other international tests.',
        'If preparation is recommended, we will suggest the best program based on your current level, target score, deadline, and the support you need.'
      ]
    },
    {
      q: 'Can a parent, guardian, or sponsor join the assessment?',
      a: [
        'Yes. If a parent, guardian, sponsor, or employer will help decide or fund preparation, we recommend they join the final 15-minute debrief.',
        'This helps them understand the student’s current level, target score, score gap, timeline, and recommended next step.'
      ]
    }
  ];

  const freshBooking = () => ({
    step: 0,
    fullName: '', whatsapp: '', email: '', bookingFor: 'Myself',
    testType: null, otherTest: '', timeline: null, targetScore: '',
    format: null, dateTime: '',
    website: '',
    openedAt: Date.now(),
    submitted: false
  });

  let state = freshBooking();
  let previouslyFocused = null;
  const modal = document.getElementById('assessmentModal');
  const content = document.getElementById('assessmentContent');
  const header = document.getElementById('modalProgressHeader');
  const stepLabel = document.getElementById('stepLabel');
  const progressBar = document.getElementById('progressBar');
  const closeBtn = document.getElementById('closeAssessment');
  const proofLightbox = document.getElementById('proofLightbox');
  const proofLightboxImage = document.getElementById('proofLightboxImage');
  const proofLightboxCaption = document.getElementById('proofLightboxCaption');
  const closeProofLightboxBtn = document.getElementById('closeProofLightbox');
  let proofTrigger = null;

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
  }

  function renderFaq() {
    const list = document.getElementById('faqList');
    list.innerHTML = FAQ_DATA.map((item, index) => `
      <div class="faq-item" data-faq="${index}">
        <button class="faq-question" type="button" aria-expanded="false">
          <span>${escapeHtml(item.q)}</span><span class="faq-chevron" aria-hidden="true">▸</span>
        </button>
        <div class="faq-answer">${item.a.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('')}</div>
      </div>`).join('');
    list.addEventListener('click', e => {
      const button = e.target.closest('.faq-question');
      if (!button) return;
      const item = button.closest('.faq-item');
      const isOpen = item.classList.toggle('open');
      button.setAttribute('aria-expanded', String(isOpen));
    });
  }

  function setupProofAutoScroll() {
    const scroller = document.querySelector('.screenshot-scroller');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const originals = [...scroller.children];
    originals.forEach(item => {
      const clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('button').forEach(button => button.tabIndex = -1);
      scroller.appendChild(clone);
    });

    let hovered = false;
    let focused = false;
    let pressed = false;
    let previousTime = null;
    let position = 0;
    let cycleWidth = 0;

    const measure = () => {
      const firstClone = scroller.children[originals.length];
      cycleWidth = firstClone ? firstClone.offsetLeft - scroller.children[0].offsetLeft : 0;
    };
    measure();
    window.addEventListener('resize', measure);

    const animate = time => {
      if (previousTime === null) previousTime = time;
      const elapsed = Math.min(time - previousTime, 50);
      previousTime = time;

      const paused = hovered || focused || pressed || proofLightbox.classList.contains('open');
      if (!paused && !reducedMotion.matches && cycleWidth > 0) {
        position += 22 * (elapsed / 1000);
        if (position >= cycleWidth) position -= cycleWidth;
        scroller.scrollLeft = position;
      }

      window.requestAnimationFrame(animate);
    };

    scroller.addEventListener('mouseenter', () => { hovered = true; });
    scroller.addEventListener('mouseleave', () => { hovered = false; });
    scroller.addEventListener('focusin', () => { focused = true; });
    scroller.addEventListener('focusout', e => {
      if (!scroller.contains(e.relatedTarget)) focused = false;
    });
    scroller.addEventListener('pointerdown', () => { pressed = true; });
    const resumeFromCurrentPosition = () => {
      if (cycleWidth > 0) position = scroller.scrollLeft % cycleWidth;
      pressed = false;
    };
    scroller.addEventListener('pointerup', resumeFromCurrentPosition);
    scroller.addEventListener('pointercancel', resumeFromCurrentPosition);

    window.requestAnimationFrame(animate);
  }

  function trackEvent(name, details = {}) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...details });
    window.dispatchEvent(new CustomEvent('lingued:analytics', { detail: { name, ...details } }));
  }

  function openProofLightbox(trigger) {
    proofTrigger = trigger;
    const thumbnail = trigger.querySelector('img');
    proofLightboxImage.src = trigger.dataset.proofImage;
    proofLightboxImage.alt = thumbnail.alt;
    proofLightboxCaption.textContent = trigger.dataset.proofCaption;
    proofLightbox.classList.add('open');
    proofLightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    closeProofLightboxBtn.focus();
  }

  function closeProofLightbox() {
    if (!proofLightbox.classList.contains('open')) return;
    proofLightbox.classList.remove('open');
    proofLightbox.setAttribute('aria-hidden', 'true');
    proofLightboxImage.src = '';
    document.body.classList.remove('modal-open');
    proofTrigger?.focus();
  }

  function setField(key, value) {
    state[key] = value;
    if (key === 'testType' && value !== 'Other') state.otherTest = '';
  }

  function choiceButtons(key, options, mode = 'stack') {
    const cls = mode === 'grid' ? 'choice-grid' : mode === 'row' ? 'choice-row' : 'choice-stack';
    return `<div class="${cls}" data-choice-group="${key}">${options.map(label => `
      <button type="button" class="choice${state[key] === label ? ' selected' : ''}" data-choice-key="${key}" data-choice-value="${escapeHtml(label)}" aria-pressed="${state[key] === label}">${escapeHtml(label)}</button>`).join('')}</div>`;
  }

  function formatButtons() {
    return `<div class="choice-stack" data-choice-group="format">${FORMAT_DATA.map(item => `
      <div class="format-option">
        <button type="button" class="choice format-choice${state.format === item.label ? ' selected' : ''}" data-choice-key="format" data-choice-value="${escapeHtml(item.label)}" aria-pressed="${state.format === item.label}">${escapeHtml(item.label)}</button>
        <p class="field-helper">${escapeHtml(item.helper)}</p>
      </div>`).join('')}</div>`;
  }

  function errorBox() { return '<div id="formError" class="error-box" role="alert"></div>'; }
  function inputField({ key, type='text', placeholder='', autocomplete='', min='' }) {
    const minAttr = min ? ` min="${escapeHtml(min)}"` : '';
    const ac = autocomplete ? ` autocomplete="${escapeHtml(autocomplete)}"` : '';
    return `<input class="text-input" id="field-${key}" data-field="${key}" type="${type}" value="${escapeHtml(state[key] || '')}" placeholder="${escapeHtml(placeholder)}"${ac}${minAttr} />`;
  }

  function step0() {
    return `<div class="form-panel">
      <div class="form-intro"><span class="form-time">Takes about 60 seconds to book</span><h1 id="assessmentTitle">What score are you working toward?</h1><p>We’ll tailor the assessment to your test and deadline.</p></div>
      ${errorBox()}
      <div class="field-group"><span class="field-label">Choose your test</span>${choiceButtons('testType', TEST_OPTIONS, 'grid')}${state.testType === 'Other' ? inputField({key:'otherTest',placeholder:'Which test?'}) : ''}</div>
      <div class="field-group"><label class="field-label" for="field-targetScore">Target score <span class="optional">Optional</span></label>${inputField({key:'targetScore',placeholder:'Example: IELTS 7.0 or TOEFL 90'})}</div>
      <div class="field-group"><span class="field-label">When do you need your score?</span>${choiceButtons('timeline', TIMELINE_OPTIONS)}</div>
      <div class="honeypot" aria-hidden="true"><label>Website<input data-field="website" type="text" tabindex="-1" autocomplete="off" value="${escapeHtml(state.website)}" /></label></div>
      <button class="btn btn-primary continue-button" type="button" data-next>Continue <span aria-hidden="true">→</span></button>
    </div>`;
  }

  function step1() {
    return `<div class="form-panel">
      <button type="button" class="back-button" data-back>← Back</button>
      <div class="step-copy"><h2 id="assessmentTitle">Where should we send your confirmation?</h2><p>We’ll use WhatsApp to confirm your assessment.</p></div>
      ${errorBox()}
      <div class="field-group"><label class="field-label" for="field-fullName">First name</label>${inputField({key:'fullName',placeholder:'Your first name',autocomplete:'given-name'})}</div>
      <div class="field-group"><label class="field-label" for="field-whatsapp">WhatsApp number</label>${inputField({key:'whatsapp',type:'tel',placeholder:'Example: 078X XXX XXX',autocomplete:'tel'})}</div>
      <div class="field-group"><label class="field-label" for="field-email">Email <span class="optional">Optional</span></label>${inputField({key:'email',type:'email',placeholder:'you@example.com',autocomplete:'email'})}</div>
      <div class="field-group"><span class="field-label">Who is the assessment for?</span>${choiceButtons('bookingFor', BOOKING_FOR_OPTIONS, 'row')}</div>
      <p class="privacy-note">Your details are used only to arrange your assessment. <a href="privacy.html" target="_blank">Privacy policy</a></p>
      <button class="btn btn-primary continue-button" type="button" data-next>Choose a Time <span aria-hidden="true">→</span></button>
    </div>`;
  }

  function availableDates() {
    const weekdays = CONFIG.AVAILABLE_WEEKDAYS || [2, 4, 6];
    const dates = [];
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    for (let offset = 1; offset <= (CONFIG.BOOKING_WINDOW_DAYS || 21) && dates.length < 6; offset += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      if (weekdays.includes(date.getDay())) dates.push(date);
    }
    return dates;
  }

  function slotPicker() {
    const times = CONFIG.AVAILABLE_TIMES || ['09:00', '11:00', '14:00'];
    return `<div class="slot-picker">${availableDates().map(date => {
      const key = date.toISOString().slice(0, 10);
      const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      return `<div class="slot-day"><h3>${escapeHtml(label)}</h3><div class="slot-times">${times.map(time => {
        const value = `${key}T${time}`;
        const display = new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        return `<button type="button" class="slot${state.dateTime === value ? ' selected' : ''}" data-choice-key="dateTime" data-choice-value="${value}" aria-pressed="${state.dateTime === value}">${display}</button>`;
      }).join('')}</div></div>`;
    }).join('')}</div>`;
  }

  function step2() {
    return `<div class="form-panel">
      <button type="button" class="back-button" data-back>← Back</button>
      <div class="step-copy"><h2 id="assessmentTitle">Choose an available time</h2><p>Only currently offered assessment times are shown.</p></div>
      ${errorBox()}
      <div class="field-group"><span class="field-label">Online or in person?</span>${formatButtons()}</div>
      <div class="field-group"><span class="field-label">Available appointments · ${escapeHtml(CONFIG.BOOKING_TIME_ZONE_LABEL || 'Kigali time (CAT)')}</span>${slotPicker()}</div>
      ${CONFIG.BOOKING_URL ? `<a class="calendar-link" href="${escapeHtml(CONFIG.BOOKING_URL)}" target="_blank" rel="noopener">View live calendar availability ↗</a>` : '<p class="schedule-preview-note">Comparison preview: replace the example schedule in <code>config.js</code> with LinguEd’s real availability before launch.</p>'}
      <button class="btn btn-primary continue-button submit-button" type="button" data-submit>Book My Free Assessment</button>
      <p class="paid-note">The assessment is free. Preparation is optional and paid separately.</p>
    </div>`;
  }

  function successView() {
    const firstName = (state.fullName || '').trim().split(/\s+/)[0] || 'there';
    const test = state.testType === 'Other' ? state.otherTest : (state.testType === 'Not sure yet' ? '' : (state.testType || ''));
    const storageNote = CONFIG.DEMO_MODE ? '<p class="submission-note">Demo mode is on: this test submission was saved only in this browser. Connect Google Sheets before publishing.</p>' : '';
    return `
      <div class="success-header">
        <span class="success-wordmark"><span>Lingu</span><span class="accent">Ed</span></span>
        <button class="icon-button" type="button" data-close-success aria-label="Close">✕</button>
      </div>
      <div class="success-content">
        <div class="success-icon">✓</div>
        <h1 id="assessmentTitle">Your assessment request has been received.</h1>
        <p>Thank you, ${escapeHtml(firstName)}. We've received your request for a free ${test ? escapeHtml(test) + ' ' : ''}Test Readiness Assessment.</p>
        <p>Our team will confirm your slot by WhatsApp. Please watch for a message from LinguEd Center.</p>
        ${storageNote}
        <button class="btn back-home" type="button" data-close-success>Back to homepage</button>
      </div>`;
  }

  function renderModal({ focusFirst = false } = {}) {
    if (state.submitted) {
      header.style.display = 'none';
      content.className = '';
      content.innerHTML = successView();
      content.querySelectorAll('[data-close-success]').forEach(el => el.addEventListener('click', closeAssessment));
      return;
    }

    header.style.display = '';
    content.className = 'assessment-content';
    stepLabel.textContent = `Step ${state.step + 1} of 3`;
    progressBar.style.width = `${((state.step + 1) / 3) * 100}%`;
    const renderers = [step0, step1, step2];
    content.innerHTML = renderers[state.step]();
    bindFormEvents();

    if (focusFirst) {
      requestAnimationFrame(() => {
        const focusable = content.querySelector('input:not([tabindex="-1"]), button:not([disabled])');
        focusable?.focus();
      });
    }
  }

  function bindFormEvents() {
    content.querySelectorAll('[data-field]').forEach(input => {
      const eventName = input.type === 'checkbox' ? 'change' : 'input';
      input.addEventListener(eventName, () => setField(input.dataset.field, input.type === 'checkbox' ? input.checked : input.value));
    });

    content.querySelectorAll('[data-choice-key]').forEach(button => {
      button.addEventListener('click', () => {
        setField(button.dataset.choiceKey, button.dataset.choiceValue);
        renderModal();
      });
    });

    content.querySelector('[data-next]')?.addEventListener('click', () => {
      syncVisibleInputs();
      const validation = validateStep(state.step);
      if (!validation.ok) return showValidation(validation);
      state.step += 1;
      trackEvent('form_step_completed', { step: state.step });
      renderModal({ focusFirst: true });
      document.querySelector('.modal-shell').scrollTo({ top: 0, behavior: 'instant' });
    });

    content.querySelector('[data-back]')?.addEventListener('click', () => {
      syncVisibleInputs();
      state.step = Math.max(0, state.step - 1);
      renderModal({ focusFirst: true });
      document.querySelector('.modal-shell').scrollTo({ top: 0, behavior: 'instant' });
    });

    content.querySelector('[data-submit]')?.addEventListener('click', submitBooking);
  }

  function syncVisibleInputs() {
    content.querySelectorAll('[data-field]').forEach(input => {
      setField(input.dataset.field, input.type === 'checkbox' ? input.checked : input.value);
    });
  }

  function normalizedPhone(value) {
    return String(value || '').replace(/[^\d+]/g, '');
  }

  function validPhone(value) {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.length >= 9 && digits.length <= 15;
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }

  function validationResult(messages, fields = []) { return { ok: messages.length === 0, messages, fields }; }

  function validateStep(step) {
    const messages = [];
    const fields = [];
    const req = (condition, message, field) => { if (!condition) { messages.push(message); if (field) fields.push(field); } };

    if (step === 0) {
      req(!!state.testType, 'Please choose the test you need.');
      if (state.testType === 'Other') req(state.otherTest.trim().length > 1, 'Please specify the test.', 'otherTest');
      req(!!state.timeline, 'Please choose when you need the score.');
    } else if (step === 1) {
      req(state.fullName.trim().length >= 2, 'Please enter your first name.', 'fullName');
      req(validPhone(state.whatsapp), 'Please enter a valid WhatsApp number.', 'whatsapp');
      if (state.email.trim()) req(validEmail(state.email), 'Please enter a valid email address.', 'email');
      req(!!state.bookingFor, 'Please choose who the assessment is for.');
    } else if (step === 2) {
      req(!!state.format, 'Please choose your preferred assessment format.');
      req(!!state.dateTime, 'Please choose an available assessment time.', 'dateTime');
      if (state.dateTime) req(new Date(state.dateTime).getTime() > Date.now(), 'Please choose a future date and time.', 'dateTime');
    }
    return validationResult(messages, fields);
  }

  function showValidation(result) {
    const box = document.getElementById('formError');
    if (box) {
      box.innerHTML = result.messages.map(m => `<div>• ${escapeHtml(m)}</div>`).join('');
      box.classList.add('visible');
      box.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    result.fields.forEach(field => document.getElementById(`field-${field}`)?.classList.add('invalid'));
    const first = result.fields[0] ? document.getElementById(`field-${result.fields[0]}`) : null;
    first?.focus({ preventScroll: true });
  }

  function qualificationScore() {
    let score = 0;
    const reasons = [];
    const add = (points, reason) => { score += points; if (reason) reasons.push(reason); };

    if (state.timeline === 'Within 30 days') add(25, 'urgent timeline');
    else if (state.timeline === 'In 1–3 months') add(20, 'near-term timeline');
    else if (state.timeline === 'In 3–6 months') add(10, 'mid-term timeline');
    else if (state.timeline === 'More than 6 months from now') add(3, 'long timeline');

    if (state.targetScore && !/not sure/i.test(state.targetScore)) add(20, 'clear target score');
    if (state.testType && state.testType !== 'Not sure yet') add(15, 'test identified');
    if (state.dateTime) add(20, 'appointment selected');

    score = Math.min(100, score);
    const status = score >= 75 ? 'HOT' : score >= 50 ? 'WARM' : score >= 30 ? 'NURTURE' : 'EARLY-STAGE';
    return { score, status, reasons };
  }

  function campaignData() {
    const p = new URLSearchParams(window.location.search);
    const get = key => p.get(key) || '';
    return {
      utmSource: get('utm_source'),
      utmMedium: get('utm_medium'),
      utmCampaign: get('utm_campaign'),
      utmContent: get('utm_content'),
      utmTerm: get('utm_term'),
      referrer: document.referrer || '',
      landingUrl: window.location.href
    };
  }

  function leadPayload() {
    const q = qualificationScore();
    return {
      submittedAt: new Date().toISOString(),
      formVersion: CONFIG.FORM_VERSION || 'landing-v1',
      leadStatus: q.status,
      leadScore: q.score,
      qualificationReasons: q.reasons.join(', '),
      fullName: state.fullName.trim(),
      whatsapp: normalizedPhone(state.whatsapp),
      email: state.email.trim(),
      bookingFor: state.bookingFor || '',
      testType: state.testType === 'Other' ? state.otherTest.trim() : (state.testType || ''),
      testTypeRaw: state.testType || '',
      reason: '',
      reasonRaw: '',
      timeline: state.timeline || '',
      takenBefore: '',
      priorScore: '',
      targetScore: state.targetScore.trim(),
      bookedOfficial: '',
      testDate: '',
      decisionMaker: '',
      funder: '',
      openness: '',
      sponsorWhatsapp: '',
      canJoinDebrief: '',
      assessmentFormat: state.format || '',
      preferredDateTime: state.dateTime || '',
      ...campaignData()
    };
  }

  async function submitBooking() {
    syncVisibleInputs();
    const result = validateStep(2);
    if (!result.ok) return showValidation(result);

    // Honeypot + minimum interaction time. Silent success for obvious bots.
    if (state.website || Date.now() - state.openedAt < 2500) {
      state.submitted = true;
      renderModal();
      return;
    }

    const button = content.querySelector('[data-submit]');
    button.disabled = true;
    button.textContent = 'Submitting…';
    const payload = leadPayload();

    try {
      if (CONFIG.DEMO_MODE) {
        const stored = JSON.parse(localStorage.getItem('lingued_demo_leads') || '[]');
        stored.push(payload);
        localStorage.setItem('lingued_demo_leads', JSON.stringify(stored.slice(-50)));
        await new Promise(resolve => setTimeout(resolve, 250));
      } else {
        if (!CONFIG.APPS_SCRIPT_URL) throw new Error('Google Sheets endpoint is not configured.');
        // GET with payload as a query param avoids the Apps Script POST redirect bug.
        const url = CONFIG.APPS_SCRIPT_URL + '?data=' + encodeURIComponent(JSON.stringify(payload));
        await fetch(url, { method: 'GET', mode: 'no-cors' });
      }
      state.submitted = true;
      trackEvent('assessment_requested', { test: payload.testType, format: payload.assessmentFormat });
      renderModal();
    } catch (err) {
      button.disabled = false;
      button.textContent = 'Book My Free Assessment';
      const box = document.getElementById('formError');
      if (box) {
        box.textContent = 'We could not submit your request. Please try again or contact LinguEd on WhatsApp.';
        box.classList.add('visible');
      }
      console.error(err);
    }
  }

  function openAssessment() {
    previouslyFocused = document.activeElement;
    trackEvent('form_started', { source: previouslyFocused?.dataset.track || 'unknown' });
    state = freshBooking();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    renderModal({ focusFirst: true });
  }

  function closeAssessment() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    state = freshBooking();
    previouslyFocused?.focus?.();
  }

  function trapFocus(e) {
    if (!modal.classList.contains('open') || e.key !== 'Tab') return;
    const focusables = [...modal.querySelectorAll('button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), a[href]')].filter(el => el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  document.querySelectorAll('.js-open-assessment').forEach(btn => btn.addEventListener('click', openAssessment));
  document.querySelector('.screenshot-scroller')?.addEventListener('click', event => {
    const button = event.target.closest('[data-proof-image]');
    if (!button) return;
    trackEvent('proof_opened', { caption: button.dataset.proofCaption });
    openProofLightbox(button);
  });
  closeProofLightboxBtn.addEventListener('click', closeProofLightbox);
  proofLightbox.addEventListener('click', e => {
    if (e.target === proofLightbox) closeProofLightbox();
  });
  closeBtn.addEventListener('click', closeAssessment);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && proofLightbox.classList.contains('open')) {
      closeProofLightbox();
      return;
    }
    if (e.key === 'Escape' && modal.classList.contains('open')) closeAssessment();
    trapFocus(e);
  });
  document.querySelectorAll('[data-placeholder-link]').forEach(link => link.addEventListener('click', e => e.preventDefault()));

  renderFaq();
  setupProofAutoScroll();
})();
