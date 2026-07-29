/**
 * SIH 2026 Internal Registration – Multi-step form app
 */
(() => {
  'use strict';

  const BRANCHES = [
    'CSE',
    'CSE (AI & ML)',
    'CSE (Data Science)',
    'ECE'
  ];

  const YEARS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];
  const GENDERS = ['Male', 'Female', 'Prefer not to say'];
  const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
  const TEAM_SIZES = [6];

  const els = {
    form: document.getElementById('registration-form'),
    container: document.getElementById('sections-container'),
    progressWrap: document.getElementById('progress-wrap'),
    progressLabel: document.getElementById('progress-label'),
    progressPct: document.getElementById('progress-pct'),
    progressBar: document.getElementById('progress-bar'),
    progressFill: document.getElementById('progress-fill'),
    sectionDots: document.getElementById('section-dots'),
    btnPrev: document.getElementById('btn-prev'),
    btnNext: document.getElementById('btn-next'),
    btnSubmit: document.getElementById('btn-submit'),
    formAlert: document.getElementById('form-alert'),
    draftStatus: document.getElementById('draft-status'),
    formView: document.getElementById('form-view'),
    confirmationView: document.getElementById('confirmation-view'),
    confRegId: document.getElementById('conf-reg-id'),
    confDatetime: document.getElementById('conf-datetime'),
    confTeam: document.getElementById('conf-team'),
    confLeader: document.getElementById('conf-leader'),
    btnDownload: document.getElementById('btn-download'),
    btnHome: document.getElementById('btn-home'),
    loadingOverlay: document.getElementById('loading-overlay')
  };

  const state = {
    currentIndex: 0,
    teamSize: 6,
    completed: new Set(),
    saveTimer: null,
    submission: null,
    isSubmitting: false
  };

  /* ---------- Helpers ---------- */

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function optionList(items, placeholder) {
    const opts = items
      .map((item) => `<option value="${escapeHtml(String(item))}">${escapeHtml(String(item))}</option>`)
      .join('');
    return `<option value="">${escapeHtml(placeholder)}</option>${opts}`;
  }

  function textField(opts) {
    const {
      name,
      label,
      type = 'text',
      validate = 'required',
      placeholder = '',
      hint = '',
      inputmode = '',
      autocomplete = ''
    } = opts;
    return `
      <div class="field" data-validate="${escapeHtml(validate)}" data-name="${escapeHtml(name)}">
        <label class="field-label" for="${escapeHtml(name)}">${escapeHtml(label)} <span class="required" aria-hidden="true">*</span></label>
        <input
          class="field-input"
          type="${escapeHtml(type)}"
          id="${escapeHtml(name)}"
          name="${escapeHtml(name)}"
          placeholder="${escapeHtml(placeholder)}"
          ${inputmode ? `inputmode="${escapeHtml(inputmode)}"` : ''}
          ${autocomplete ? `autocomplete="${escapeHtml(autocomplete)}"` : ''}
          aria-required="true"
        />
        ${hint ? `<p class="field-hint">${escapeHtml(hint)}</p>` : ''}
        <p class="field-error" role="alert"></p>
      </div>`;
  }

  function selectField(name, label, optionsHtml, validate = 'required') {
    return `
      <div class="field" data-validate="${escapeHtml(validate)}" data-name="${escapeHtml(name)}">
        <label class="field-label" for="${escapeHtml(name)}">${escapeHtml(label)} <span class="required" aria-hidden="true">*</span></label>
        <select class="field-select" id="${escapeHtml(name)}" name="${escapeHtml(name)}" aria-required="true">
          ${optionsHtml}
        </select>
        <p class="field-error" role="alert"></p>
      </div>`;
  }

  function personFields(prefix, includeTeamFields = false) {
    let html = '';
    html += textField({
      name: `${prefix}_fullName`,
      label: 'Full Name',
      validate: 'name',
      placeholder: 'Enter full name',
      autocomplete: 'name'
    });
    html += textField({
      name: `${prefix}_rollNumber`,
      label: 'University Roll Number',
      validate: 'roll',
      placeholder: 'e.g. 21CSE001'
    });
    html += textField({
      name: `${prefix}_collegeId`,
      label: 'College ID (Enrollment Number)',
      validate: 'enrollment',
      placeholder: 'e.g. ENR2021001'
    });
    html += selectField(
      `${prefix}_branch`,
      'Branch / Department',
      optionList(BRANCHES, 'Select branch')
    );

    // Year radios with label injected after
    html += `
      <div class="field" data-validate="radio" data-name="${prefix}_year">
        <span class="field-label" id="${prefix}_year_label">Current Year <span class="required" aria-hidden="true">*</span></span>
        <div class="radio-group" role="radiogroup" aria-labelledby="${prefix}_year_label">
          ${YEARS.map(
            (y, i) => `
            <label class="radio-option">
              <input type="radio" name="${prefix}_year" value="${escapeHtml(y)}" id="${prefix}_year_${i}" />
              <span>${escapeHtml(y)}</span>
            </label>`
          ).join('')}
        </div>
        <p class="field-error" role="alert"></p>
      </div>`;

    html += selectField(
      `${prefix}_semester`,
      'Semester',
      optionList(SEMESTERS, 'Select semester')
    );

    html += `
      <div class="field" data-validate="radio" data-name="${prefix}_gender">
        <span class="field-label" id="${prefix}_gender_label">Gender <span class="required" aria-hidden="true">*</span></span>
        <div class="radio-group" role="radiogroup" aria-labelledby="${prefix}_gender_label">
          ${GENDERS.map(
            (g, i) => `
            <label class="radio-option">
              <input type="radio" name="${prefix}_gender" value="${escapeHtml(g)}" id="${prefix}_gender_${i}" />
              <span>${escapeHtml(g)}</span>
            </label>`
          ).join('')}
        </div>
        <p class="field-error" role="alert"></p>
      </div>`;

    html += textField({
      name: `${prefix}_email`,
      label: 'Personal Email ID',
      type: 'email',
      validate: 'email',
      placeholder: 'name@example.com',
      autocomplete: 'email'
    });
    html += textField({
      name: `${prefix}_whatsapp`,
      label: 'WhatsApp Number',
      type: 'tel',
      validate: 'phone',
      placeholder: '10-digit mobile number',
      inputmode: 'numeric',
      autocomplete: 'tel',
      hint: 'Enter 10-digit Indian mobile number without +91'
    });

    if (includeTeamFields) {
      html += textField({
        name: 'teamName',
        label: 'Team Name',
        validate: 'required',
        placeholder: 'Enter your team name'
      });
      html += `
        <div class="field" data-name="teamSize">
          <label class="field-label">Total Number of Team Members</label>
          <input
            class="field-input"
            type="text"
            value="6 Members (1 Team Leader + 5 Team Members)"
            readonly
            disabled
            style="background-color: #f8f9fa; color: #3c4043; font-weight: 500; cursor: not-allowed;"
          />
          <input type="hidden" name="teamSize" value="6" />
          <p class="field-hint">SIH 2026 mandates a team size of exactly 6 members (1 Team Leader + 5 Members).</p>
        </div>`;
    }

    return html;
  }

  function getSectionDefs() {
    const memberCount = Math.max(0, state.teamSize - 1);
    const defs = [
      {
        id: 'leader',
        title: 'Team Leader Details',
        type: 'leader'
      }
    ];

    for (let i = 1; i <= memberCount; i++) {
      defs.push({
        id: `member_${i}`,
        title: `Team Member Details (Member ${i})`,
        type: 'member',
        memberIndex: i
      });
    }

    defs.push({
      id: 'declaration',
      title: 'Declaration',
      type: 'declaration'
    });

    return defs;
  }

  /* ---------- Render ---------- */

  function renderSections() {
    const defs = getSectionDefs();
    const existingData = collectFormData(false);

    els.container.innerHTML = defs
      .map((def, index) => {
        let body = '';
        if (def.type === 'leader') {
          body = personFields('leader', true);
        } else if (def.type === 'member') {
          body = personFields(`member${def.memberIndex}`, false);
        } else {
          body = `
            <div class="checkbox-group">
              <div class="field" data-validate="checkbox" data-name="declare_truth">
                <label class="checkbox-option">
                  <input type="checkbox" name="declare_truth" id="declare_truth" value="yes" />
                  <span>I hereby certify that all the information provided is true and correct to the best of my knowledge. <span class="required" aria-hidden="true">*</span></span>
                </label>
                <p class="field-error" role="alert"></p>
              </div>
              <div class="field" data-validate="checkbox" data-name="declare_internal">
                <label class="checkbox-option">
                  <input type="checkbox" name="declare_internal" id="declare_internal" value="yes" />
                  <span>I understand that this is only the Internal Registration for Smart India Hackathon (SIH) 2026 and does not guarantee selection. <span class="required" aria-hidden="true">*</span></span>
                </label>
                <p class="field-error" role="alert"></p>
              </div>
              <div class="field" data-validate="checkbox" data-name="declare_contact">
                <label class="checkbox-option">
                  <input type="checkbox" name="declare_contact" id="declare_contact" value="yes" />
                  <span>I agree to receive all SIH-related communication through my registered email and WhatsApp number. <span class="required" aria-hidden="true">*</span></span>
                </label>
                <p class="field-error" role="alert"></p>
              </div>
            </div>`;
        }

        return `
          <section
            class="form-section${index === state.currentIndex ? ' active' : ''}"
            data-section-id="${escapeHtml(def.id)}"
            data-section-index="${index}"
            aria-labelledby="section-title-${index}"
            ${index === state.currentIndex ? '' : 'hidden'}
          >
            <h3 class="section-title" id="section-title-${index}">${escapeHtml(def.title)}</h3>
            ${body}
          </section>`;
      })
      .join('');

    // Restore values after rebuild
    applyFormData(existingData);

    bindLiveValidation();
    updateUI();
  }

  function onTeamSizeChange(e) {
    const newSize = parseInt(e.target.value, 10);
    if (!TEAM_SIZES.includes(newSize)) return;

    // Preserve current answers before rebuild
    const data = collectFormData(false);
    state.teamSize = newSize;

    // Clamp current index if sections shrink
    const defs = getSectionDefs();
    if (state.currentIndex >= defs.length) {
      state.currentIndex = defs.length - 1;
    }

    // Clear completion markers beyond new length
    state.completed = new Set(
      [...state.completed].filter((i) => i < defs.length - 1 || i === state.currentIndex)
    );

    renderSections();
    applyFormData(data);
    scheduleSave();
  }

  function bindLiveValidation() {
    els.container.querySelectorAll('.field[data-validate]').forEach((field) => {
      field.querySelectorAll('input, select').forEach((input) => {
        const eventName = input.type === 'radio' || input.type === 'checkbox' ? 'change' : 'blur';
        input.addEventListener(eventName, () => {
          Validation.validateField(field);
          scheduleSave();
        });
        if (input.tagName === 'SELECT' || input.type === 'radio' || input.type === 'checkbox') {
          input.addEventListener('change', () => scheduleSave());
        } else {
          input.addEventListener('input', () => scheduleSave());
        }
      });
    });
  }

  /* ---------- Progress & Navigation ---------- */

  function getSections() {
    return [...els.container.querySelectorAll('.form-section')];
  }

  function updateUI() {
    const sections = getSections();
    const total = sections.length;
    const index = Math.min(state.currentIndex, total - 1);
    state.currentIndex = index;

    sections.forEach((section, i) => {
      const active = i === index;
      section.classList.toggle('active', active);
      if (active) {
        section.removeAttribute('hidden');
      } else {
        section.setAttribute('hidden', '');
      }
    });

    const displayPct = Math.round(((index + 1) / total) * 100);

    els.progressLabel.textContent = `Section ${index + 1} of ${total}`;
    els.progressPct.textContent = `${displayPct}% complete`;
    els.progressFill.style.width = `${displayPct}%`;
    els.progressBar.setAttribute('aria-valuenow', String(displayPct));

    // Dots
    els.sectionDots.innerHTML = sections
      .map((_, i) => {
        let cls = 'section-dot';
        if (i === index) cls += ' current';
        else if (state.completed.has(i)) cls += ' completed';
        return `<span class="${cls}" title="Section ${i + 1}"></span>`;
      })
      .join('');

    const isFirst = index === 0;
    const isLast = index === total - 1;

    els.btnPrev.hidden = isFirst;
    els.btnNext.hidden = isLast;
    els.btnSubmit.hidden = !isLast;

    hideAlert();
  }

  function showAlert(message) {
    els.formAlert.textContent = message;
    els.formAlert.classList.add('visible');
  }

  function hideAlert() {
    els.formAlert.textContent = '';
    els.formAlert.classList.remove('visible');
  }

  function goNext() {
    const sections = getSections();
    const current = sections[state.currentIndex];
    if (!Validation.validateSection(current)) {
      showAlert('Please complete all required fields in this section before continuing.');
      return;
    }
    hideAlert();
    state.completed.add(state.currentIndex);
    if (state.currentIndex < sections.length - 1) {
      state.currentIndex += 1;
      updateUI();
      scheduleSave();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function goPrev() {
    if (state.currentIndex > 0) {
      state.currentIndex -= 1;
      updateUI();
      scheduleSave();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /* ---------- Data collect / apply ---------- */

  function collectFormData(normalize = true) {
    const data = {
      currentIndex: state.currentIndex,
      teamSize: 6,
      completed: [...state.completed],
      fields: { teamSize: '6' }
    };

    els.form.querySelectorAll('input, select').forEach((el) => {
      if (!el.name) return;
      if (el.type === 'radio') {
        if (el.checked) data.fields[el.name] = el.value;
        return;
      }
      if (el.type === 'checkbox') {
        data.fields[el.name] = el.checked;
        return;
      }
      let value = el.value;
      if (normalize && el.name.endsWith('_whatsapp')) {
        value = Validation.normalizePhone(value);
      }
      data.fields[el.name] = value;
    });

    // Ensure teamSize from select if present
    if (data.fields.teamSize) {
      data.teamSize = parseInt(data.fields.teamSize, 10) || data.teamSize;
    }

    return data;
  }

  function applyFormData(data) {
    if (!data?.fields) return;

    if (data.teamSize && TEAM_SIZES.includes(data.teamSize)) {
      state.teamSize = data.teamSize;
    }

    Object.entries(data.fields).forEach(([name, value]) => {
      const radios = els.form.querySelectorAll(`input[type="radio"][name="${CSS.escape(name)}"]`);
      if (radios.length) {
        radios.forEach((r) => {
          r.checked = r.value === value;
        });
        return;
      }
      const checkbox = els.form.querySelector(`input[type="checkbox"][name="${CSS.escape(name)}"]`);
      if (checkbox) {
        checkbox.checked = Boolean(value);
        return;
      }
      const input = els.form.querySelector(`[name="${CSS.escape(name)}"]`);
      if (input) input.value = value ?? '';
    });

    const teamSizeSelect = document.getElementById('teamSize');
    if (teamSizeSelect && data.teamSize) {
      teamSizeSelect.value = String(data.teamSize);
    }
  }

  /* ---------- Auto-save ---------- */

  function scheduleSave() {
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(saveDraftNow, 400);
  }

  function saveDraftNow() {
    const data = collectFormData(false);
    const ok = Storage.saveDraft(data);
    if (ok) {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      els.draftStatus.textContent = `Draft saved at ${time}`;
      els.draftStatus.classList.add('saved');
    }
  }

  function restoreDraft() {
    const draft = Storage.loadDraft();
    if (!draft) return false;

    state.teamSize = 6;
    if (Array.isArray(draft.completed)) {
      state.completed = new Set(draft.completed);
    }
    if (typeof draft.currentIndex === 'number') {
      state.currentIndex = draft.currentIndex;
    }

    renderSections();
    applyFormData(draft);

    const total = getSections().length;
    if (state.currentIndex >= total) state.currentIndex = Math.max(0, total - 1);
    updateUI();

    els.draftStatus.textContent = draft.savedAt
      ? `Draft restored from ${new Date(draft.savedAt).toLocaleString()}`
      : 'Draft restored';
    els.draftStatus.classList.add('saved');
    return true;
  }

  /* ---------- Submit & Confirmation ---------- */

  function setSubmitting(isSubmitting) {
    state.isSubmitting = isSubmitting;
    els.btnSubmit.disabled = isSubmitting;
    els.btnPrev.disabled = isSubmitting;
    els.btnNext.disabled = isSubmitting;
    els.btnSubmit.classList.toggle('is-loading', isSubmitting);
    els.btnSubmit.setAttribute('aria-busy', isSubmitting ? 'true' : 'false');

    if (els.loadingOverlay) {
      els.loadingOverlay.classList.toggle('visible', isSubmitting);
      els.loadingOverlay.setAttribute('aria-busy', isSubmitting ? 'true' : 'false');
      if (isSubmitting) {
        els.loadingOverlay.removeAttribute('hidden');
      } else {
        els.loadingOverlay.setAttribute('hidden', '');
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (state.isSubmitting) return;

    const sections = getSections();
    const current = sections[state.currentIndex];
    if (!Validation.validateSection(current)) {
      showAlert('Please accept all declarations before submitting.');
      return;
    }

    // Validate all sections once more
    for (let i = 0; i < sections.length; i++) {
      state.currentIndex = i;
      updateUI();
      if (!Validation.validateSection(sections[i])) {
        showAlert(`Please complete Section ${i + 1} before submitting.`);
        return;
      }
      state.completed.add(i);
    }

    // Stay on declaration section while submitting
    state.currentIndex = sections.length - 1;
    updateUI();

    const formData = collectFormData(true);
    setSubmitting(true);
    hideAlert();

    try {
      const result = await Api.submitRegistration(formData);

      if (!result.success) {
        showAlert(result.message || 'Registration failed. Please try again.');
        return;
      }

      const submittedAtDisplay =
        result.timestamp ||
        new Date().toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });

      const submission = {
        registrationId: result.registrationId,
        submittedAt: new Date().toISOString(),
        submittedAtDisplay,
        message: result.message,
        ...formData
      };

      Storage.saveSubmission(submission);
      Storage.clearDraft();
      state.submission = submission;
      showConfirmation(submission);
    } catch (err) {
      showAlert('Something went wrong while submitting. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function showConfirmation(submission) {
    els.formView.style.display = 'none';
    els.progressWrap.style.display = 'none';
    els.confirmationView.classList.add('visible');

    els.confRegId.textContent = submission.registrationId;
    els.confDatetime.textContent = submission.submittedAtDisplay;
    els.confTeam.textContent = submission.fields.teamName || '—';
    els.confLeader.textContent = submission.fields.leader_fullName || '—';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function downloadAcknowledgement() {
    const submission = state.submission || Storage.loadSubmission();
    if (!submission) return;

    try {
      await Receipt.downloadPdf(submission);
    } catch (err) {
      alert(err.message || 'Unable to generate PDF receipt. Please refresh and try again.');
    }
  }

  function returnHome() {
    Storage.clearSubmission();
    state.submission = null;
    state.currentIndex = 0;
    state.teamSize = 6;
    state.completed = new Set();

    els.confirmationView.classList.remove('visible');
    els.formView.style.display = '';
    els.progressWrap.style.display = '';
    els.form.reset();
    renderSections();
    els.draftStatus.textContent = '';
    els.draftStatus.classList.remove('saved');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- Init ---------- */

  function init() {
    const existingSubmission = Storage.loadSubmission();
    if (existingSubmission) {
      state.submission = existingSubmission;
      showConfirmation(existingSubmission);
    }

    const restored = !existingSubmission && restoreDraft();
    if (!restored) {
      renderSections();
    }

    els.btnNext.addEventListener('click', goNext);
    els.btnPrev.addEventListener('click', goPrev);
    els.form.addEventListener('submit', handleSubmit);
    els.btnDownload.addEventListener('click', downloadAcknowledgement);
    els.btnHome.addEventListener('click', returnHome);

    // Keyboard: Enter moves focus to next field, or advances section
    els.form.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.matches('input.field-input')) {
        e.preventDefault();
        const section = e.target.closest('.form-section');
        const inputs = [...section.querySelectorAll('input.field-input, select.field-select')];
        const idx = inputs.indexOf(e.target);
        if (idx > -1 && idx < inputs.length - 1) {
          inputs[idx + 1].focus();
        } else if (!els.btnNext.hidden) {
          goNext();
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
