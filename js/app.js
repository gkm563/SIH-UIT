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
    instructionsView: document.getElementById('instructions-view'),
    btnStartRegistration: document.getElementById('btn-start-registration'),
    btnViewInstructionsHeader: document.getElementById('btn-view-instructions-header'),
    confirmationView: document.getElementById('confirmation-view'),
    confRegId: document.getElementById('conf-reg-id'),
    confDatetime: document.getElementById('conf-datetime'),
    confTeam: document.getElementById('conf-team'),
    confLeader: document.getElementById('conf-leader'),
    confEmailStatus: document.getElementById('conf-email-status'),
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
    isSubmitting: false,
    instructionsAccepted: false
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
        validate: 'teamName',
        placeholder: 'Enter a unique team name (e.g. CodeCrafters)',
        hint: 'Rule: Must be unique and must not contain institute name (e.g. UIT, United).'
      });
      html += `<div id="teamName-live-badge" class="mt-2 text-xs font-semibold hidden" aria-live="polite"></div>`;
      html += `
        <div class="field" data-name="teamSize">
          <label class="field-label">Total Number of Team Members <span class="required" aria-hidden="true">*</span></label>
          <input
            class="field-input"
            type="text"
            value="6 Members (1 Team Leader + 5 Team Members)"
            readonly
            disabled
            aria-readonly="true"
            style="background-color: #f8f9fa; color: #3c4043; font-weight: 500; cursor: not-allowed;"
          />
          <input type="hidden" name="teamSize" id="teamSize" value="6" />
          <p class="field-hint">SIH 2026 mandates a team size of exactly 6 members (1 Team Leader + 5 Members).</p>
          <p class="field-hint">At least <strong>one female member</strong> is mandatory in every team.</p>
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
        let bannerHtml = '';

        if (def.type === 'leader') {
          body = personFields('leader', true);
          bannerHtml = `
            <div class="section-banner bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 text-white rounded-2xl p-4 sm:p-5 mb-5 shadow-sm border border-blue-600/30">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/15 text-white flex items-center justify-center text-xl sm:text-2xl font-bold flex-shrink-0 border border-white/20">
                    👑
                  </div>
                  <div>
                    <span class="inline-block bg-blue-500/30 text-blue-100 text-[10px] sm:text-xs font-extrabold px-2.5 py-0.5 rounded-full mb-0.5 border border-blue-400/30">
                      Person 1 of 6 · Team Leader
                    </span>
                    <h3 class="text-base sm:text-xl font-extrabold text-white leading-tight m-0">Team Leader Details</h3>
                    <p class="text-xs text-blue-100/90 m-0 mt-0.5">Enter the personal &amp; college details of the main Team Leader.</p>
                  </div>
                </div>
                <span class="text-xs font-extrabold bg-white text-blue-900 px-3 py-1.5 rounded-lg flex-shrink-0 shadow-2xs">
                  Step 1 of 7
                </span>
              </div>
            </div>`;
        } else if (def.type === 'member') {
          const mIdx = def.memberIndex;
          const personNum = mIdx + 1;
          body = personFields(`member${mIdx}`, false);
          bannerHtml = `
            <div class="section-banner bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 mb-5 shadow-sm border-l-4 border-amber-400 border-t border-r border-b border-slate-700/50">
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center text-xl sm:text-2xl font-bold flex-shrink-0 border border-amber-400/30">
                    👤
                  </div>
                  <div>
                    <div class="flex items-center gap-2 flex-wrap mb-1">
                      <span class="inline-block bg-amber-400/20 text-amber-200 text-[10px] sm:text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-amber-400/30">
                        Person ${personNum} of 6 · Team Member ${mIdx}
                      </span>
                      <span class="inline-block bg-red-500/20 text-red-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-red-400/30">
                        ⛔ NOT Team Leader
                      </span>
                    </div>
                    <h3 class="text-base sm:text-xl font-extrabold text-white leading-tight m-0">Team Member ${mIdx} Details</h3>
                    <div class="mt-1.5 p-2 bg-amber-500/10 border border-amber-400/30 rounded-lg text-xs text-amber-100 font-medium">
                      ⚠️ <strong>Attention:</strong> Enter <u>Member ${mIdx}'s OWN name &amp; roll number</u>. Do <strong>NOT</strong> fill Team Leader's details again!
                    </div>
                  </div>
                </div>
                <span class="text-xs font-extrabold bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg flex-shrink-0 shadow-2xs">
                  Step ${personNum} of 7
                </span>
              </div>
            </div>`;
        } else {
          body = `
            <div class="section-banner bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-4 sm:p-5 mb-5 shadow-sm">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 text-white flex items-center justify-center text-xl sm:text-2xl font-bold flex-shrink-0">
                    📋
                  </div>
                  <div>
                    <span class="inline-block bg-emerald-400/30 text-emerald-100 text-[10px] sm:text-xs font-extrabold px-2.5 py-0.5 rounded-full mb-0.5">
                      Final Step 7 of 7 · Declaration
                    </span>
                    <h3 class="text-base sm:text-xl font-extrabold text-white leading-tight m-0">Final Declaration &amp; Submit</h3>
                    <p class="text-xs text-emerald-100/90 m-0 mt-0.5">Review and accept rules before submitting form.</p>
                  </div>
                </div>
              </div>
            </div>
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
            ${bannerHtml}
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
          checkCrossMemberDuplicates();
          scheduleSave();
        });
        if (input.tagName === 'SELECT' || input.type === 'radio' || input.type === 'checkbox') {
          input.addEventListener('change', () => scheduleSave());
        } else {
          input.addEventListener('input', () => {
            scheduleSave();
            if (input.name && (input.name.includes('rollNumber') || input.name.includes('email'))) {
              checkCrossMemberDuplicates();
            }
          });
        }
      });
    });
  }

  function checkCrossMemberDuplicates() {
    const data = collectFormData(false);
    const fields = data.fields || {};

    const rollMap = {};
    const emailMap = {};

    const people = [
      { key: 'leader', label: 'Team Leader' },
      { key: 'member1', label: 'Team Member 1' },
      { key: 'member2', label: 'Team Member 2' },
      { key: 'member3', label: 'Team Member 3' },
      { key: 'member4', label: 'Team Member 4' },
      { key: 'member5', label: 'Team Member 5' }
    ];

    people.forEach((p) => {
      const roll = String(fields[`${p.key}_rollNumber`] || '').trim().toUpperCase();
      const email = String(fields[`${p.key}_email`] || '').trim().toLowerCase();

      if (roll) {
        if (rollMap[roll]) {
          const inputEl = els.form.querySelector(`input[name="${p.key}_rollNumber"]`);
          if (inputEl) {
            const fieldEl = inputEl.closest('.field');
            Validation.setFieldError(
              fieldEl,
              `⚠️ Warning: Roll Number "${roll}" is already used by ${rollMap[roll]}! Enter ${p.label}'s own Roll Number.`
            );
          }
        } else {
          rollMap[roll] = p.label;
        }
      }

      if (email) {
        if (emailMap[email]) {
          const inputEl = els.form.querySelector(`input[name="${p.key}_email"]`);
          if (inputEl) {
            const fieldEl = inputEl.closest('.field');
            Validation.setFieldError(
              fieldEl,
              `⚠️ Warning: Email "${email}" is already used by ${emailMap[email]}! Enter ${p.label}'s own Email ID.`
            );
          }
        } else {
          emailMap[email] = p.label;
        }
      }
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

    const stepTitles = [
      '👑 Team Leader Details (Person 1/6)',
      '👤 Member 1 Details (Person 2/6)',
      '👤 Member 2 Details (Person 3/6)',
      '👤 Member 3 Details (Person 4/6)',
      '👤 Member 4 Details (Person 5/6)',
      '👤 Member 5 Details (Person 6/6)',
      '📋 Final Declaration & Submit'
    ];

    els.progressLabel.innerHTML = `<strong>Step ${index + 1} of ${total}:</strong> ${stepTitles[index] || `Section ${index + 1}`}`;
    els.progressPct.textContent = `${displayPct}% complete`;
    els.progressFill.style.width = `${displayPct}%`;
    els.progressBar.setAttribute('aria-valuenow', String(displayPct));

    // Dots / Stepper Chips
    const chipLabels = ['👑 Leader', '👤 M1', '👤 M2', '👤 M3', '👤 M4', '👤 M5', '📋 Submit'];
    els.sectionDots.innerHTML = sections
      .map((_, i) => {
        let cls = 'px-2 py-0.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer border';
        if (i === index) {
          cls += ' bg-blue-600 text-white border-blue-700 shadow-2xs scale-105 ring-2 ring-blue-300';
        } else if (state.completed.has(i)) {
          cls += ' bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200';
        } else {
          cls += ' bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200';
        }
        return `<button type="button" class="${cls}" data-step-btn="${i}">${chipLabels[i] || `S${i + 1}`}</button>`;
      })
      .join('');

    const isFirst = index === 0;
    const isLast = index === total - 1;

    els.btnPrev.hidden = false;
    if (isFirst) {
      els.btnPrev.textContent = '← Back to Instructions';
      els.btnPrev.title = 'Re-read the registration guidelines & instructions';
    } else {
      els.btnPrev.textContent = 'Previous';
      els.btnPrev.title = 'Go back to previous section';
    }

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

  function hasAtLeastOneFemaleMember() {
    const genders = [];
    const leader = els.form.querySelector('input[name="leader_gender"]:checked');
    if (leader) genders.push(leader.value);
    for (let i = 1; i <= 5; i++) {
      const m = els.form.querySelector(`input[name="member${i}_gender"]:checked`);
      if (m) genders.push(m.value);
    }
    return genders.some((g) => g === 'Female');
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
    } else {
      showInstructions();
    }
  }

  /* ---------- Data collect / apply ---------- */

  function collectFormData(normalize = true) {
    const data = {
      currentIndex: state.currentIndex,
      teamSize: 6,
      completed: [...state.completed],
      fields: {}
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

    data.fields.teamSize = '6';
    data.teamSize = 6;

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

    if (!hasAtLeastOneFemaleMember()) {
      showAlert(
        'Each team must include at least one female member. Please update Gender for the Team Leader or a Team Member, then submit again.'
      );
      return;
    }

    const formData = collectFormData(true);
    formData.teamSize = 6;
    formData.fields.teamSize = '6';
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
        emailSent: !!result.emailSent,
        emailTo: result.emailTo || formData.fields.leader_email || '',
        emailMessage: result.emailMessage || '',
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

  function showInstructions() {
    state.instructionsAccepted = false;
    try {
      sessionStorage.removeItem('sih2026_instructions_accepted');
    } catch {
      // ignore
    }
    if (els.instructionsView) {
      els.instructionsView.hidden = false;
    }
    if (els.formView) {
      els.formView.hidden = true;
      els.formView.style.display = 'none';
    }
    if (els.progressWrap) {
      els.progressWrap.hidden = true;
      els.progressWrap.style.display = 'none';
    }
    els.confirmationView.classList.remove('visible');

    if (els.btnStartRegistration) {
      const hasEnteredData = Boolean(Storage.loadDraft() || state.currentIndex > 0);
      els.btnStartRegistration.textContent = hasEnteredData
        ? 'Continue Registration →'
        : 'I have read the instructions — Start Registration';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startRegistration() {
    state.instructionsAccepted = true;
    try {
      sessionStorage.setItem('sih2026_instructions_accepted', '1');
    } catch {
      // ignore
    }
    if (els.instructionsView) {
      els.instructionsView.hidden = true;
    }
    if (els.formView) {
      els.formView.hidden = false;
      els.formView.style.display = '';
    }
    if (els.progressWrap) {
      els.progressWrap.hidden = false;
      els.progressWrap.style.display = '';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showConfirmation(submission) {
    if (els.instructionsView) els.instructionsView.hidden = true;
    els.formView.hidden = true;
    els.formView.style.display = 'none';
    els.progressWrap.hidden = true;
    els.progressWrap.style.display = 'none';
    els.confirmationView.classList.add('visible');

    els.confRegId.textContent = submission.registrationId;
    els.confDatetime.textContent = submission.submittedAtDisplay;
    els.confTeam.textContent = submission.fields.teamName || '—';
    els.confLeader.textContent = submission.fields.leader_fullName || '—';

    if (els.confEmailStatus) {
      if (submission.emailSent) {
        els.confEmailStatus.textContent =
          'Sent to ' + (submission.emailTo || submission.fields.leader_email || 'Team Leader');
        els.confEmailStatus.style.color = '#188038';
      } else if (submission.emailMessage) {
        els.confEmailStatus.textContent = 'Not sent — ' + submission.emailMessage;
        els.confEmailStatus.style.color = '#d93025';
      } else {
        els.confEmailStatus.textContent =
          'Check Team Leader inbox/Spam. If missing, Apps Script mail permission may need authorization.';
        els.confEmailStatus.style.color = '#5f6368';
      }
    }

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
    els.form.reset();
    renderSections();
    els.draftStatus.textContent = '';
    els.draftStatus.classList.remove('saved');
    showInstructions();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function fetchRegisteredTeams() {
    try {
      const res = await Api.getRegisteredTeams();
      if (res && res.success && Array.isArray(res.teams)) {
        window._registeredTeamsList = res.teams;
      }
    } catch {
      window._registeredTeamsList = [];
    }
  }

  function checkTeamNameLive(inputEl) {
    if (!inputEl) return;
    const value = inputEl.value;
    const badgeEl = document.getElementById('teamName-live-badge');
    const fieldEl = inputEl.closest('.field');

    if (!value || !value.trim()) {
      if (badgeEl) {
        badgeEl.classList.add('hidden');
        badgeEl.innerHTML = '';
      }
      Validation.clearFieldError(fieldEl);
      return;
    }

    const check = Validation.validateTeamName(value, window._registeredTeamsList || []);

    if (!check.ok) {
      if (badgeEl) {
        badgeEl.className = 'mt-2 text-xs font-semibold px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center gap-1.5';
        badgeEl.innerHTML = `
          <svg class="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span>${escapeHtml(check.message)}</span>`;
        badgeEl.classList.remove('hidden');
      }
      Validation.setFieldError(fieldEl, check.message);
    } else {
      if (badgeEl) {
        badgeEl.className = 'mt-2 text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5';
        badgeEl.innerHTML = `
          <svg class="w-4 h-4 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <span>✨ "${escapeHtml(value.trim())}" is unique &amp; available!</span>`;
        badgeEl.classList.remove('hidden');
      }
      Validation.clearFieldError(fieldEl);
    }
  }

  /* ---------- Init ---------- */

  function init() {
    fetchRegisteredTeams();

    // Only restore confirmation for real server Registration IDs (SIH2026-XXXX)
    const existingSubmission = Storage.loadSubmission();
    const validStored =
      existingSubmission &&
      existingSubmission.registrationId &&
      Api.REG_ID_RE.test(String(existingSubmission.registrationId));

    if (validStored) {
      state.submission = existingSubmission;
      showConfirmation(existingSubmission);
    } else if (existingSubmission) {
      Storage.clearSubmission();
    }

    const restored = !validStored && restoreDraft();
    if (!restored) {
      renderSections();
    }

    // Show instructions first unless already accepted this session or confirming
    let accepted = false;
    try {
      accepted = sessionStorage.getItem('sih2026_instructions_accepted') === '1';
    } catch {
      accepted = false;
    }

    if (validStored) {
      if (els.instructionsView) els.instructionsView.hidden = true;
    } else if (accepted) {
      startRegistration();
    } else {
      showInstructions();
    }

    if (window.location.protocol === 'file:') {
      showAlert(
        'Important: Do not open this page as a file. Run a local server and open http://localhost:5500 — otherwise Google Sheets will not receive data.'
      );
    }

    if (els.btnStartRegistration) {
      els.btnStartRegistration.addEventListener('click', startRegistration);
    }
    if (els.btnViewInstructionsHeader) {
      els.btnViewInstructionsHeader.addEventListener('click', showInstructions);
    }

    els.btnNext.addEventListener('click', goNext);
    els.btnPrev.addEventListener('click', goPrev);
    els.form.addEventListener('submit', handleSubmit);
    els.btnDownload.addEventListener('click', downloadAcknowledgement);
    els.btnHome.addEventListener('click', returnHome);

    els.sectionDots.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-step-btn]');
      if (!btn) return;
      const targetIdx = parseInt(btn.dataset.stepBtn, 10);
      if (!isNaN(targetIdx) && targetIdx >= 0 && targetIdx < getSections().length) {
        if (targetIdx <= state.currentIndex || state.completed.has(targetIdx - 1)) {
          state.currentIndex = targetIdx;
          updateUI();
          scheduleSave();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    });

    let checkTimer = null;
    els.form.addEventListener('input', (e) => {
      if (e.target && e.target.name === 'teamName') {
        clearTimeout(checkTimer);
        checkTimer = setTimeout(() => {
          checkTeamNameLive(e.target);
        }, 150);
      }
    });

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
