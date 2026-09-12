(() => {
  'use strict';

  const CONFIG = window.LINGUED_CONFIG || {};
  const TEST_OPTIONS = ['TOEFL', 'IELTS', 'SAT', 'ACT', 'GRE', 'TEF', 'Not sure yet', 'Other'];
  const REASON_OPTIONS = ['University admission', 'Scholarship application', 'Immigration or visa requirement', 'Job or career opportunity', 'School requirement', 'Not sure yet', 'Other'];
  const TIMELINE_OPTIONS = ['Within 30 days', 'In 1–3 months', 'In 3–6 months', 'More than 6 months from now', "I'm not sure yet"];
  const BOOKING_FOR_OPTIONS = ['Myself', 'My child', 'Someone else'];
  const YES_NO = ['Yes', 'No'];
  const BOOKED_OFFICIAL_OPTIONS = ['Yes', 'No', 'Not yet, but I plan to'];
  const DECISION_MAKER_OPTIONS = ['I would decide myself', 'My parent/guardian', 'My sponsor', 'My employer/institution', 'Someone else'];
  const FUNDER_OPTIONS = ['I would pay myself', 'My parent/guardian', 'My sponsor', 'My employer/institution', 'Someone else', 'Not sure yet'];
  const OPENNESS_OPTIONS = ['Yes', 'Maybe, depends on the recommendation', 'Not right now'];
  const DEBRIEF_OPTIONS = ['Yes', 'Maybe, I need to ask them', 'No'];
  const SPONSOR_LABELS = ['My parent/guardian', 'My sponsor', 'My employer/institution', 'Someone else'];
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
    fullName: '', whatsapp: '', email: '', bookingFor: null,
    testType: null, otherTest: '', reason: null, otherReason: '', timeline: null,
    takenBefore: null, priorScore: '', targetScore: '', bookedOfficial: null, testDate: '',
    decisionMaker: null, funder: null, openness: null, sponsorWhatsapp: '', canJoinDebrief: null,
    format: null, dateTime: '', confirmChecked: false,
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

  function setupRotatingHeadline() {
    const words = ['TOEFL', 'IELTS', 'SAT', 'GRE', 'ACT'];
    let i = 0;
    const el = document.getElementById('rotatingWord');
    setInterval(() => {
      i = (i + 1) % words.length;
      el.textContent = words[i];
    }, 1700);
  }

  function setupProofAutoScroll() {
    const scroller = document.querySelector('.screenshot-scroller');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let hovered = false;
    let focused = false;
    let pressed = false;
    let direction = 1;
    let previousTime = null;

    const animate = time => {
      if (previousTime === null) previousTime = time;
      const elapsed = Math.min(time - previousTime, 50);
      previousTime = time;

      const paused = hovered || focused || pressed || proofLightbox.classList.contains('open');
      if (!paused && !reducedMotion.matches && scroller.scrollWidth > scroller.clientWidth) {
        const maxScroll = scroller.scrollWidth - scroller.clientWidth;
        scroller.scrollLeft += direction * 18 * (elapsed / 1000);
        if (scroller.scrollLeft >= maxScroll - 1) direction = -1;
        else if (scroller.scrollLeft <= 1) direction = 1;
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
    scroller.addEventListener('pointerup', () => { pressed = false; });
    scroller.addEventListener('pointercancel', () => { pressed = false; });

    window.requestAnimationFrame(animate);
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

  function isSponsorInvolved() {
    return SPONSOR_LABELS.includes(state.decisionMaker) || SPONSOR_LABELS.includes(state.funder);
  }

  function setField(key, value) {
    state[key] = value;
    cleanupDependentFields(key);
  }

  function cleanupDependentFields(changedKey) {
    if (changedKey === 'testType' && state.testType !== 'Other') state.otherTest = '';
    if (changedKey === 'reason' && state.reason !== 'Other') state.otherReason = '';
    if (changedKey === 'takenBefore' && state.takenBefore !== 'Yes') state.priorScore = '';
    if (changedKey === 'bookedOfficial' && state.bookedOfficial !== 'Yes') state.testDate = '';
    if (changedKey === 'decisionMaker' || changedKey === 'funder') {
      if (!isSponsorInvolved()) {
        state.sponsorWhatsapp = '';
        state.canJoinDebrief = null;
      }
    }
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
    return `
      <div class="form-panel">
        <div class="form-intro">
          <h1 id="assessmentTitle">Book Your Free Test Readiness Assessment</h1>
          <p>Find out your current level, score gap, and recommended preparation plan before your official test.</p>
        </div>
        <div class="step-copy">
          <h2>First, tell us who the assessment is for.</h2>
          <p>This helps us prepare the right assessment and contact the right person.</p>
        </div>
        ${errorBox()}
        <div class="field-group"><label class="field-label" for="field-fullName">Full name</label>${inputField({key:'fullName',placeholder:'Enter your full name',autocomplete:'name'})}</div>
        <div class="field-group"><label class="field-label" for="field-whatsapp">WhatsApp number</label>${inputField({key:'whatsapp',type:'tel',placeholder:'Example: 078X XXX XXX',autocomplete:'tel'})}<p class="field-helper">We'll use this to confirm your assessment slot.</p></div>
        <div class="field-group"><label class="field-label" for="field-email">Email address</label>${inputField({key:'email',type:'email',placeholder:'Enter your email',autocomplete:'email'})}<p class="field-helper">We may send your assessment report or confirmation here.</p></div>
        <div class="field-group"><span class="field-label">Who are you booking this assessment for?</span>${choiceButtons('bookingFor', BOOKING_FOR_OPTIONS, 'row')}</div>
        <div class="honeypot" aria-hidden="true"><label>Website<input data-field="website" type="text" tabindex="-1" autocomplete="off" value="${escapeHtml(state.website)}" /></label></div>
        <button class="btn btn-primary continue-button" type="button" data-next>Continue</button>
      </div>`;
  }

  function step1() {
    return `
      <div class="form-panel">
        <button type="button" class="back-button" data-back>← Back</button>
        <div class="step-copy"><h2 id="assessmentTitle">What test are you preparing for?</h2><p>The assessment will be adjusted based on the test you need.</p></div>
        ${errorBox()}
        <div class="field-group"><span class="field-label">Which test do you need?</span>${choiceButtons('testType', TEST_OPTIONS, 'grid')}${state.testType === 'Other' ? inputField({key:'otherTest',placeholder:'Please specify the test'}) : ''}</div>
        <div class="field-group"><span class="field-label">Why do you need this test?</span>${choiceButtons('reason', REASON_OPTIONS)}${state.reason === 'Other' ? inputField({key:'otherReason',placeholder:'Please tell us why you need the test'}) : ''}</div>
        <div class="field-group"><span class="field-label">When do you need the score?</span>${choiceButtons('timeline', TIMELINE_OPTIONS)}</div>
        <button class="btn btn-primary continue-button" type="button" data-next>Continue</button>
      </div>`;
  }

  function step2() {
    const today = new Date().toISOString().slice(0,10);
    return `
      <div class="form-panel">
        <button type="button" class="back-button" data-back>← Back</button>
        <div class="step-copy"><h2 id="assessmentTitle">Where are you starting from?</h2><p>No pressure. The goal is to understand your current level, not to judge you.</p></div>
        ${errorBox()}
        <div class="field-group"><span class="field-label">Have you taken this test before?</span>${choiceButtons('takenBefore', YES_NO, 'row')}${state.takenBefore === 'Yes' ? inputField({key:'priorScore',placeholder:'Example: TOEFL 72/120, IELTS 6.0, SAT 1150'}) : ''}</div>
        <div class="field-group"><label class="field-label" for="field-targetScore">What score are you aiming for or required to achieve?</label>${inputField({key:'targetScore',placeholder:'Example: TOEFL 90+, IELTS 7.0, SAT 1300'})}<p class="field-helper">If you don't know yet, write "Not sure."</p></div>
        <div class="field-group"><span class="field-label">Have you already booked the official test?</span>${choiceButtons('bookedOfficial', BOOKED_OFFICIAL_OPTIONS)}${state.bookedOfficial === 'Yes' ? inputField({key:'testDate',type:'date',min:today}) : ''}</div>
        <button class="btn btn-primary continue-button" type="button" data-next>Continue</button>
      </div>`;
  }

  function step3() {
    const sponsor = isSponsorInvolved();
    return `
      <div class="form-panel">
        <button type="button" class="back-button" data-back>← Back</button>
        <div class="step-copy"><h2 id="assessmentTitle">Who should be involved if preparation is recommended?</h2><p>The assessment is 100% free. If preparation is recommended after the assessment, we want to make sure the right person understands the result and next steps.</p></div>
        ${errorBox()}
        <div class="field-group"><span class="field-label">If preparation is recommended, who would help decide or approve enrollment?</span>${choiceButtons('decisionMaker', DECISION_MAKER_OPTIONS)}</div>
        <div class="field-group"><span class="field-label">Who would fund the preparation if you choose to enroll?</span>${choiceButtons('funder', FUNDER_OPTIONS)}</div>
        <div class="field-group"><span class="field-label">If preparation is recommended, would you or your family/sponsor be open to investing in structured preparation?</span>${choiceButtons('openness', OPENNESS_OPTIONS)}</div>
        ${sponsor ? `
          <div class="field-group"><label class="field-label" for="field-sponsorWhatsapp">Please share the WhatsApp number of the person who may help decide or fund preparation.</label>${inputField({key:'sponsorWhatsapp',type:'tel',placeholder:'Parent/sponsor WhatsApp number',autocomplete:'tel'})}<p class="field-helper">We may only contact them to confirm or debrief the assessment if needed.</p></div>
          <div class="field-group"><span class="field-label">Can they join a short 15-minute debrief after the assessment?</span>${choiceButtons('canJoinDebrief', DEBRIEF_OPTIONS)}<p class="field-helper">This helps them understand your current level, target score, score gap, and recommended next step.</p></div>` : ''}
        <button class="btn btn-primary continue-button" type="button" data-next>Continue to booking</button>
      </div>`;
  }

  function localDateTimeMin() {
    const d = new Date(Date.now() + 15 * 60 * 1000);
    d.setMinutes(Math.ceil(d.getMinutes()/15)*15, 0, 0);
    const pad = n => String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function step4() {
    return `
      <div class="form-panel">
        <button type="button" class="back-button" data-back>← Back</button>
        <div class="step-copy"><h2 id="assessmentTitle">Choose your assessment time</h2><p>Assessment slots are limited because each assessment is reviewed by our instructor.</p></div>
        ${errorBox()}
        <div class="field-group"><span class="field-label">Choose your preferred format</span>${formatButtons()}</div>
        <div class="field-group"><label class="field-label" for="field-dateTime">Select your date and time</label>${inputField({key:'dateTime',type:'datetime-local',min:localDateTimeMin()})}</div>
        <label class="checkbox-label"><input id="confirmChecked" type="checkbox" ${state.confirmChecked ? 'checked' : ''} /><span>I understand that this assessment is free, and preparation programs are paid separately if recommended.</span></label>
        <button class="btn btn-primary continue-button submit-button" type="button" data-submit ${state.confirmChecked ? '' : 'disabled'}>Confirm My Free Assessment</button>
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
        ${isSponsorInvolved() ? '<p class="debrief-note">Since you indicated that someone else may help decide or fund preparation, we may ask them to join the final 15-minute debrief so they can understand your score gap and recommendation.</p>' : ''}
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
    stepLabel.textContent = `Step ${state.step + 1} of 5`;
    progressBar.style.width = `${((state.step + 1) / 5) * 100}%`;
    const renderers = [step0, step1, step2, step3, step4];
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
      renderModal({ focusFirst: true });
      document.querySelector('.modal-shell').scrollTo({ top: 0, behavior: 'instant' });
    });

    content.querySelector('[data-back]')?.addEventListener('click', () => {
      syncVisibleInputs();
      state.step = Math.max(0, state.step - 1);
      renderModal({ focusFirst: true });
      document.querySelector('.modal-shell').scrollTo({ top: 0, behavior: 'instant' });
    });

    const checkbox = content.querySelector('#confirmChecked');
    checkbox?.addEventListener('change', () => {
      state.confirmChecked = checkbox.checked;
      const submit = content.querySelector('[data-submit]');
      if (submit) submit.disabled = !state.confirmChecked;
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
      req(state.fullName.trim().length >= 2, 'Please enter the full name.', 'fullName');
      req(validPhone(state.whatsapp), 'Please enter a valid WhatsApp number.', 'whatsapp');
      req(validEmail(state.email), 'Please enter a valid email address.', 'email');
      req(!!state.bookingFor, 'Please choose who the assessment is for.');
    } else if (step === 1) {
      req(!!state.testType, 'Please choose the test you need.');
      if (state.testType === 'Other') req(state.otherTest.trim().length > 1, 'Please specify the test.', 'otherTest');
      req(!!state.reason, 'Please tell us why you need the test.');
      if (state.reason === 'Other') req(state.otherReason.trim().length > 2, 'Please tell us why you need the test.', 'otherReason');
      req(!!state.timeline, 'Please choose when you need the score.');
    } else if (step === 2) {
      req(!!state.takenBefore, 'Please tell us whether you have taken the test before.');
      if (state.takenBefore === 'Yes') req(state.priorScore.trim().length > 0, 'Please enter your previous score (or write "Not sure").', 'priorScore');
      req(state.targetScore.trim().length > 0, 'Please enter your target score (or write "Not sure").', 'targetScore');
      req(!!state.bookedOfficial, 'Please tell us whether you have booked the official test.');
      if (state.bookedOfficial === 'Yes') {
        req(!!state.testDate, 'Please choose the official test date.', 'testDate');
        if (state.testDate) req(new Date(`${state.testDate}T23:59:59`) >= new Date(), 'The official test date cannot be in the past.', 'testDate');
      }
    } else if (step === 3) {
      req(!!state.decisionMaker, 'Please choose who would help decide or approve enrollment.');
      req(!!state.funder, 'Please choose who would fund preparation.');
      req(!!state.openness, 'Please tell us whether you would be open to structured preparation.');
      if (isSponsorInvolved()) {
        req(validPhone(state.sponsorWhatsapp), 'Please enter a valid parent/sponsor WhatsApp number.', 'sponsorWhatsapp');
        req(!!state.canJoinDebrief, 'Please tell us whether they can join the debrief.');
      }
    } else if (step === 4) {
      req(!!state.format, 'Please choose your preferred assessment format.');
      req(!!state.dateTime, 'Please choose your preferred date and time.', 'dateTime');
      if (state.dateTime) req(new Date(state.dateTime).getTime() > Date.now(), 'Please choose a future date and time.', 'dateTime');
      req(state.confirmChecked, 'Please confirm that you understand the assessment is free and preparation is paid separately.');
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

    if (state.bookedOfficial === 'Yes') add(20, 'official test booked');
    else if (state.bookedOfficial === 'Not yet, but I plan to') add(10, 'plans to book official test');

    if (state.targetScore && !/not sure/i.test(state.targetScore)) add(10, 'clear target score');
    if (state.takenBefore === 'Yes' && state.priorScore && !/not sure/i.test(state.priorScore)) add(8, 'known starting score');

    if (state.decisionMaker === 'I would decide myself') add(10, 'self decision-maker');
    else if (state.decisionMaker && state.decisionMaker !== 'Someone else') add(6, 'decision-maker identified');

    if (state.funder === 'I would pay myself') add(10, 'self-funded');
    else if (state.funder && state.funder !== 'Not sure yet' && state.funder !== 'Someone else') add(8, 'funder identified');

    if (state.openness === 'Yes') add(17, 'open to preparation');
    else if (state.openness === 'Maybe, depends on the recommendation') add(9, 'possibly open to preparation');

    if (isSponsorInvolved() && state.canJoinDebrief === 'Yes') add(5, 'sponsor can join debrief');
    else if (isSponsorInvolved() && state.canJoinDebrief === 'Maybe, I need to ask them') add(2, 'sponsor may join debrief');

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
      reason: state.reason === 'Other' ? state.otherReason.trim() : (state.reason || ''),
      reasonRaw: state.reason || '',
      timeline: state.timeline || '',
      takenBefore: state.takenBefore || '',
      priorScore: state.takenBefore === 'Yes' ? state.priorScore.trim() : '',
      targetScore: state.targetScore.trim(),
      bookedOfficial: state.bookedOfficial || '',
      testDate: state.bookedOfficial === 'Yes' ? state.testDate : '',
      decisionMaker: state.decisionMaker || '',
      funder: state.funder || '',
      openness: state.openness || '',
      sponsorWhatsapp: isSponsorInvolved() ? normalizedPhone(state.sponsorWhatsapp) : '',
      canJoinDebrief: isSponsorInvolved() ? (state.canJoinDebrief || '') : '',
      assessmentFormat: state.format || '',
      preferredDateTime: state.dateTime || '',
      ...campaignData()
    };
  }

  async function submitBooking() {
    syncVisibleInputs();
    const result = validateStep(4);
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
      renderModal();
    } catch (err) {
      button.disabled = false;
      button.textContent = 'Confirm My Free Assessment';
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
  document.querySelectorAll('[data-proof-image]').forEach(btn => btn.addEventListener('click', () => openProofLightbox(btn)));
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
  setupRotatingHeadline();
  setupProofAutoScroll();
})();
