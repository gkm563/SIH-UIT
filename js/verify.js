/**
 * SIH 2026 Team Registration Details Verification Portal Script
 * Live Google Sheets Roster Data — Strict Search by Registration ID, Team Name, or Member Email
 * Direct Sheet Logging for Confirmation (Column BH) and Minor Corrections (Column BG)
 */
(() => {
  'use strict';

  const els = {
    form: document.getElementById('verify-form'),
    input: document.getElementById('verify-input'),
    btnSubmit: document.getElementById('btn-verify-submit'),
    errorBox: document.getElementById('verify-error'),
    resultsContainer: document.getElementById('verify-results-container')
  };

  let allTeamsData = [];

  function detectMaliciousPayload(str) {
    if (!str) return false;
    const pattern = /('|"|;|--|\/\*|\*\/|\bOR\b\s+['"\d]|\bAND\b\s+['"\d]|\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|\bUPDATE\b|<script)/i;
    return pattern.test(str);
  }

  function cleanVal(val, defaultVal = '') {
    if (!val || val === 'N/A' || val === 'NA' || val === 'undefined') return defaultVal;
    return String(val).trim();
  }

  function normalizeTeamData(rawTeam) {
    const f = rawTeam.fields || rawTeam;
    const regId = rawTeam.registrationId || f.registrationId || 'SIH2026-REG';
    const name = rawTeam.teamName || f.teamName || 'Registered Team';

    const leaderName = cleanVal(f.teamLeaderName || f.leaderName || f.leader_name || f.name || rawTeam.teamLeaderName, 'Team Leader');
    const leaderGender = cleanVal(f.leaderGender || f.leader_gender || f.gender || rawTeam.leaderGender, 'Registered');
    const leaderBranch = cleanVal(f.leaderBranch || f.leader_branch || f.branch || rawTeam.leaderBranch, 'CSE');
    const leaderYear = cleanVal(f.leaderYear || f.leader_year || f.year || rawTeam.leaderYear, '3rd Year');
    const leaderSem = cleanVal(f.leaderSemester || f.leader_semester || f.semester || rawTeam.leaderSemester, '6th Sem');
    const leaderMobile = cleanVal(f.leaderMobile || f.leader_mobile || f.phone || rawTeam.leaderMobile, 'On Record');
    const leaderEmail = cleanVal(f.leaderEmail || f.leader_email || f.email || rawTeam.leaderEmail, 'On Record');
    const nocFileUrl = cleanVal(f.nocFileUrl || f.noc_url || f.pdfUrl || f.college_letter_pdf || rawTeam.nocFileUrl, '');

    let rawMembers = Array.isArray(rawTeam.teamMembers || f.teamMembers) ? (rawTeam.teamMembers || f.teamMembers) : [];

    let members = rawMembers.map((m, idx) => ({
      name: cleanVal(m.name || m.memberName, ''),
      gender: cleanVal(m.gender, 'Registered'),
      branch: cleanVal(m.branch, leaderBranch),
      year: cleanVal(m.year, leaderYear),
      sem: cleanVal(m.sem || m.semester, leaderSem),
      mobile: cleanVal(m.mobile || m.phone, 'On Record'),
      email: cleanVal(m.email, 'On Record')
    })).filter(m => m.name !== '');

    return {
      registrationId: regId,
      teamName: name,
      confirmedStatus: rawTeam.confirmedStatus || '',
      teamLeaderName: leaderName,
      leaderGender,
      leaderBranch,
      leaderYear,
      leaderSemester: leaderSem,
      leaderMobile,
      leaderEmail,
      nocFileUrl,
      teamMembers: members
    };
  }

  async function loadTeams() {
    try {
      if (typeof Api !== 'undefined' && typeof Api.getRegisteredTeams === 'function') {
        const res = await Api.getRegisteredTeams(false);
        if (res && Array.isArray(res.teams) && res.teams.length > 0) {
          allTeamsData = res.teams.map(normalizeTeamData);
        } else if (typeof Api.getLocalCachedTeams === 'function') {
          const cached = Api.getLocalCachedTeams();
          if (cached && Array.isArray(cached.teams)) {
            allTeamsData = cached.teams.map(normalizeTeamData);
          }
        }
      }
    } catch {
      if (typeof Api !== 'undefined' && typeof Api.getLocalCachedTeams === 'function') {
        const cached = Api.getLocalCachedTeams();
        if (cached && Array.isArray(cached.teams)) {
          allTeamsData = cached.teams.map(normalizeTeamData);
        }
      }
    }
  }

  function handleLookup(query) {
    if (!query) return;
    const q = query.toLowerCase().trim();

    if (detectMaliciousPayload(q)) {
      showError('🚨 <strong>SECURITY ALERT:</strong> Malicious input or script payload blocked!');
      if (els.resultsContainer) els.resultsContainer.classList.add('hidden');
      return;
    }

    if (!allTeamsData || allTeamsData.length === 0) {
      showError('Teams database is loading... Please wait 2 seconds and try again.');
      return;
    }

    const isEmail = q.includes('@');
    const isRegFormat = /^sih2026-\d{3,4}$/i.test(q) || /^\d{4}$/.test(q);

    const matched = allTeamsData.find(t => {
      const fullRegId = (t.registrationId || '').toLowerCase();
      const numPart = fullRegId.replace(/^sih2026-?/i, '');

      // 1. Strict Registration ID Match (Full SIH2026-XXXX or exact 4-digit code e.g. 0032, 0139)
      if (isRegFormat) {
        if (fullRegId === q) return true;
        if (numPart === q) return true;
        if (('sih2026-' + q.padStart(4, '0')) === fullRegId) return true;
      }

      // 2. Strict Email ID Match (Leader Email OR Email of ANY Team Member)
      if (isEmail) {
        if ((t.leaderEmail || '').toLowerCase().trim() === q) return true;
        if ((t.teamMembers || []).some(m => (m.email || '').toLowerCase().trim() === q)) return true;
      }

      // 3. Strict Team Name Match (Minimum 3 characters)
      if (q.length >= 3) {
        const tNameLower = (t.teamName || '').toLowerCase().trim();
        if (tNameLower === q || tNameLower.includes(q)) return true;
      }

      return false;
    });

    if (matched) {
      hideError();
      renderVerificationCard(matched);
    } else {
      showError(`❌ No registered team found matching "${escapeHtml(query)}". Search is restricted to: Registration ID (e.g. SIH2026-xxxx), Registered Team Name, or Email ID of ANY Team Member.`);
      if (els.resultsContainer) els.resultsContainer.classList.add('hidden');
    }
  }

  function renderVerificationCard(team) {
    if (!els.resultsContainer) return;

    const regId = team.registrationId || 'SIH2026-REG';

    // State comes entirely from the Google Sheet (Col BH), NOT localStorage
    const isConfirmed = (team.confirmedStatus || '').toLowerCase() === 'confirmed';

    // Build real roster list directly from live Google Sheet data
    const rosterList = [];

    // Slot 0: Leader
    rosterList.push({
      isLeader: true,
      role: '👑 TEAM LEADER',
      name: team.teamLeaderName || 'Team Leader',
      gender: team.leaderGender || 'Registered',
      branch: team.leaderBranch || 'CSE',
      year: team.leaderYear || '3rd Year',
      sem: team.leaderSemester || '6th Sem',
      mobile: team.leaderMobile || 'On Record',
      email: team.leaderEmail || 'On Record'
    });

    // Slots 1 to N: Real Team Members
    if (Array.isArray(team.teamMembers) && team.teamMembers.length > 0) {
      team.teamMembers.forEach((m, idx) => {
        rosterList.push({
          isLeader: false,
          role: `👤 MEMBER #${idx + 1}`,
          name: m.name,
          gender: m.gender || 'Registered',
          branch: m.branch || team.leaderBranch || 'CSE',
          year: m.year || team.leaderYear || '3rd Year',
          sem: m.sem || team.leaderSemester || '6th Sem',
          mobile: m.mobile || 'On Record',
          email: m.email || 'On Record'
        });
      });
    }

    let html = `
      <div class="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-md space-y-6 relative">
        
        <!-- Status Header Bar -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-mono text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">${regId}</span>
              <span id="confirmation-badge" class="${isConfirmed ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'} border text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5">
                <span>${isConfirmed ? '✅ Confirmed' : '🔍 Verification Mode Active'}</span>
              </span>
            </div>
            <h2 class="text-2xl sm:text-3xl font-black text-slate-900 mt-2">${escapeHtml(team.teamName)}</h2>
            <p class="text-xs font-semibold text-slate-500 mt-0.5">United Institute of Technology · SIH 2026 Internal Registration Record</p>
          </div>

          <div class="text-right">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Verification Status</span>
            <span id="status-label" class="inline-flex items-center gap-1.5 text-xs font-extrabold ${isConfirmed ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-700 bg-slate-100 border-slate-200'} border px-3 py-1 rounded-xl mt-1">
              ${isConfirmed ? 'Confirmed' : 'Review & Confirm Below'}
            </span>
          </div>
        </div>

        <!-- Registered Team Name Card -->
        <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <div class="text-xs font-bold uppercase text-slate-500">Registered Team Name</div>
            <div class="text-lg font-extrabold text-slate-900 mt-0.5">${escapeHtml(team.teamName)}</div>
          </div>
          <div class="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
            Registration ID: ${regId}
          </div>
        </div>

        <!-- Registered Team Member Roster Table -->
        <div class="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
          <div class="bg-slate-100/90 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <span class="text-xs font-bold text-slate-800 uppercase tracking-wider">Registered Team Member Roster (${rosterList.length} Members)</span>
            <span class="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">${rosterList.length} Members</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th class="py-3 px-4">Role</th>
                  <th class="py-3 px-4">Member Name</th>
                  <th class="py-3 px-4">Gender</th>
                  <th class="py-3 px-4">Branch / Year</th>
                  <th class="py-3 px-4">Email ID</th>
                  <th class="py-3 px-4">Mobile No.</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
    `;

    rosterList.forEach(st => {
      const isFemale = String(st.gender).toLowerCase().includes('female');
      const roleBadge = st.isLeader
        ? `<span class="inline-flex items-center gap-1 text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-200 px-2 py-0.5 rounded">👑 LEADER</span>`
        : `<span class="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">${st.role}</span>`;

      const genderBadge = isFemale
        ? `<span class="inline-flex items-center gap-1 text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200 px-2 py-0.5 rounded-full">👩 FEMALE</span>`
        : `<span class="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">👨 MALE</span>`;

      const emailDisplay = (st.email && st.email.includes('@'))
        ? `<a href="mailto:${escapeHtml(st.email)}" class="hover:underline text-slate-800 font-semibold">✉️ ${escapeHtml(st.email)}</a>`
        : `<span class="text-slate-500 font-medium">📋 ${escapeHtml(st.email)}</span>`;

      const mobileDisplay = (st.mobile && st.mobile.replace(/\D/g, '').length >= 7)
        ? `<a href="tel:${escapeHtml(st.mobile)}" class="hover:underline font-bold text-blue-700">📞 ${escapeHtml(st.mobile)}</a>`
        : `<span class="text-slate-500 font-medium">📋 ${escapeHtml(st.mobile)}</span>`;

      html += `
        <tr class="${st.isLeader ? 'bg-blue-50/30' : 'hover:bg-slate-50/60'} transition-colors">
          <td class="py-3.5 px-4">${roleBadge}</td>
          <td class="py-3.5 px-4 font-bold text-slate-900 text-sm">${escapeHtml(st.name)}</td>
          <td class="py-3.5 px-4">${genderBadge}</td>
          <td class="py-3.5 px-4">
            <div class="font-bold text-slate-800">${escapeHtml(st.branch)}</div>
            <div class="text-[11px] text-slate-500 font-medium">${escapeHtml(st.year)}</div>
          </td>
          <td class="py-3.5 px-4 font-mono text-xs">${emailDisplay}</td>
          <td class="py-3.5 px-4 font-mono text-xs">${mobileDisplay}</td>
        </tr>
      `;
    });

    html += `
              </tbody>
            </table>
          </div>
        </div>

        <!-- Simple Action Bar -->
        <div id="confirmation-action-box" class="pt-5 border-t border-slate-100">

          ${isConfirmed ? `
            <!-- Confirmed Done State -->
            <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div class="text-xs text-emerald-700 font-bold">All details confirmed and logged for official SIH portal submission.</div>
              <div class="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-5 py-3 rounded-xl">
                <span class="text-emerald-700 font-black text-sm">✅ Done — Details Confirmed</span>
              </div>
            </div>
          ` : `
            <!-- Default: Two clean action buttons -->
            <div class="flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                id="btn-report-correction"
                class="w-full sm:w-auto px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                onclick="reportCorrection('${escapeHtml(team.teamName)}', '${regId}')"
              >
                <span>✏️ Report Minor Correction</span>
              </button>
              <button
                type="button"
                id="btn-confirm-correct"
                class="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                onclick="confirmTeamData('${regId}')"
              >
                <span>✅ All Details Are Correct — Confirm</span>
              </button>
            </div>
          `}

        </div>

      </div>
    `;

    els.resultsContainer.innerHTML = html;
    els.resultsContainer.classList.remove('hidden');
    els.resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  window.confirmTeamData = (regId) => {
    // Call API — writes 'Confirmed' to Column BH in sheet
    if (typeof Api !== 'undefined' && typeof Api.sendConfirmation === 'function') {
      Api.sendConfirmation(regId, 'Confirmed');
    }

    // Update status badge
    const badge = document.getElementById('confirmation-badge');
    if (badge) {
      badge.className = 'bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5';
      badge.innerHTML = '<span>✅ Confirmed</span>';
    }
    const statusLabel = document.getElementById('status-label');
    if (statusLabel) {
      statusLabel.className = 'inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 border px-3 py-1 rounded-xl mt-1';
      statusLabel.textContent = 'Confirmed';
    }

    // Replace entire action box with Done state
    const actionBox = document.getElementById('confirmation-action-box');
    if (actionBox) {
      actionBox.innerHTML = `
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="text-xs text-emerald-700 font-bold">All details confirmed and logged for official SIH portal submission.</div>
          <div class="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-5 py-3 rounded-xl">
            <span class="text-emerald-700 font-black text-sm">✅ Done — Details Confirmed</span>
          </div>
        </div>
      `;
    }
  };

  window.reportCorrection = (teamName, regId) => {
    const modal = document.getElementById('correction-modal');
    if (!modal) return;

    const teamIdInput = document.getElementById('corr-team-id');
    const teamNameInput = document.getElementById('corr-team-name');
    const modalSubtitle = document.getElementById('corr-modal-subtitle');
    const statusMsg = document.getElementById('corr-status-msg');

    if (teamIdInput) teamIdInput.value = regId || '';
    if (teamNameInput) teamNameInput.value = teamName || '';
    if (modalSubtitle) modalSubtitle.textContent = `Correction request for team "${teamName}" (${regId})`;
    if (statusMsg) statusMsg.classList.add('hidden');

    modal.classList.remove('hidden');
  };

  window.closeCorrectionModal = () => {
    const modal = document.getElementById('correction-modal');
    if (modal) modal.classList.add('hidden');
  };

  function showError(msg) {
    if (els.errorBox) {
      els.errorBox.innerHTML = msg;
      els.errorBox.classList.remove('hidden');
    }
  }

  function hideError() {
    if (els.errorBox) {
      els.errorBox.classList.add('hidden');
    }
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function bindEvents() {
    if (els.form) {
      els.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = els.input ? els.input.value : '';
        handleLookup(val);
      });
    }

    const corrForm = document.getElementById('correction-form');
    if (corrForm) {
      corrForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const regId = document.getElementById('corr-team-id').value;
        const teamName = document.getElementById('corr-team-name').value;
        const author = document.getElementById('corr-author-name').value;
        const contact = document.getElementById('corr-author-contact').value;
        const oldVal = document.getElementById('corr-old-val').value;
        const newVal = document.getElementById('corr-new-val').value;

        const timeStr = new Date().toLocaleString();
        const payload = { regId, teamName, author, contact, oldVal, newVal, timeStr };

        // Send directly to Google Sheet Column BG (Report)
        if (typeof Api !== 'undefined' && typeof Api.sendReport === 'function') {
          Api.sendReport(payload);
        }

        // Update status badge live in DOM without re-rendering
        const badge = document.getElementById('confirmation-badge');
        if (badge) {
          badge.className = 'bg-orange-100 text-orange-800 border border-orange-300 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5';
          badge.innerHTML = '<span>⚠️ Correction Reported</span>';
        }
        const statusLabel = document.getElementById('status-label');
        if (statusLabel) {
          statusLabel.className = 'inline-flex items-center gap-1.5 text-xs font-extrabold text-orange-700 bg-orange-50 border border-orange-200 border px-3 py-1 rounded-xl mt-1';
          statusLabel.textContent = 'Correction Reported — Pending Review';
        }

        const statusMsg = document.getElementById('corr-status-msg');
        if (statusMsg) {
          statusMsg.className = 'text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-xl font-bold text-center';
          statusMsg.innerHTML = `✅ <strong>Correction Request Submitted!</strong><br/>Your correction has been logged in the master spreadsheet.`;
          statusMsg.classList.remove('hidden');
        }

        setTimeout(() => {
          window.closeCorrectionModal();
          const oldValIn = document.getElementById('corr-old-val');
          const newValIn = document.getElementById('corr-new-val');
          const authorIn = document.getElementById('corr-author-name');
          const contactIn = document.getElementById('corr-author-contact');
          if (oldValIn) oldValIn.value = '';
          if (newValIn) newValIn.value = '';
          if (authorIn) authorIn.value = '';
          if (contactIn) contactIn.value = '';
        }, 1200);
      });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id') || urlParams.get('regId') || urlParams.get('search');
    if (idParam) {
      if (els.input) els.input.value = idParam;
      setTimeout(() => handleLookup(idParam), 500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      await loadTeams();
      bindEvents();
    });
  } else {
    (async () => {
      await loadTeams();
      bindEvents();
    })();
  }
})();
