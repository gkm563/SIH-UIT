/**
 * SIH 2026 Advanced Admin Intelligence Portal Script
 * Real-time Analytics, Filter Engine, Team Roster Viewer & Live Sheet Synchronization
 */
(() => {
  'use strict';

  const els = {
    loginCard: document.getElementById('login-card'),
    dashboard: document.getElementById('admin-dashboard'),
    loginForm: document.getElementById('admin-login-form'),
    pinInput: document.getElementById('admin-pin'),
    loginError: document.getElementById('login-error'),
    userBadge: document.getElementById('admin-user-badge'),
    logoutBtn: document.getElementById('btn-admin-logout'),

    // Toggles & Sync
    btnSyncLive: document.getElementById('btn-sync-live'),
    syncSpinner: document.getElementById('sync-spinner'),
    btnToggleReg: document.getElementById('btn-toggle-reg'),
    btnTogglePs: document.getElementById('btn-toggle-ps'),

    // Stat Elements
    statTotalTeams: document.getElementById('stat-total-teams'),
    statTotalParticipants: document.getElementById('stat-total-participants'),
    statMaleCount: document.getElementById('stat-male-count'),
    statFemaleCount: document.getElementById('stat-female-count'),
    statGenderBreakdown: document.getElementById('stat-gender-breakdown'),
    statY1: document.getElementById('stat-y1'),
    statY2: document.getElementById('stat-y2'),
    statY3: document.getElementById('stat-y3'),
    statY4: document.getElementById('stat-y4'),
    statCseCount: document.getElementById('stat-cse-count'),
    statOtherBranches: document.getElementById('stat-other-branches'),

    // Search & Filter Controls
    adminSearch: document.getElementById('admin-search'),
    filterYear: document.getElementById('filter-year'),
    filterBranch: document.getElementById('filter-branch'),
    filterGender: document.getElementById('filter-gender'),
    filterPs: document.getElementById('filter-ps'),
    btnExportCsv: document.getElementById('btn-export-csv'),
    filteredCountBadge: document.getElementById('filtered-count-badge'),
    lastSyncBadge: document.getElementById('last-sync-badge'),

    // Table & Modal
    teamsTableBody: document.getElementById('teams-table-body'),
    adminTableEmpty: document.getElementById('admin-table-empty'),
    rosterModal: document.getElementById('team-roster-modal'),
    modalTeamId: document.getElementById('modal-team-id'),
    modalTeamName: document.getElementById('modal-team-name'),
    modalPsClaimedTag: document.getElementById('modal-ps-claimed-tag'),
    modalRosterBody: document.getElementById('modal-roster-body')
  };

  const SESSION_KEY = 'sih2026_admin_token';
  const MAX_ATTEMPTS = 3;
  const VALID_HASHES = [
    '0b3b4f62086e392df85e82845c43d9b4344bb3c19b0a1d486d34e9e0fa95610d', // 8924059058
    'd8a9e70e28e1a1ef4c2957b447833589b2b512c1b72a6b225bfebcf1f31f9b36', // 8924
    '87c8d9e68df6d0b30ef2d99d9841f39be9b22e1b106497f62c0b435213600e57'  // sih2026
  ];

  let rawTeamsData = [];
  let filteredTeams = [];
  let failedAttempts = 0;
  let lockoutTimer = null;

  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function isAuthed() {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) return false;
    const timestamp = parseInt(token, 10);
    if (isNaN(timestamp) || Date.now() - timestamp > 45 * 60 * 1000) {
      sessionStorage.removeItem(SESSION_KEY);
      return false;
    }
    return true;
  }

  function setAuthed(status) {
    if (status) {
      sessionStorage.setItem(SESSION_KEY, String(Date.now()));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  function init() {
    if (isAuthed()) {
      showDashboard();
    } else {
      showLogin();
    }
    bindEvents();
  }

  function showLogin() {
    if (els.loginCard) els.loginCard.classList.remove('hidden');
    if (els.dashboard) els.dashboard.classList.add('hidden');
    if (els.userBadge) {
      els.userBadge.classList.add('hidden');
      els.userBadge.classList.remove('flex');
    }
  }

  async function showDashboard() {
    if (els.loginCard) els.loginCard.classList.add('hidden');
    if (els.dashboard) els.dashboard.classList.remove('hidden');
    if (els.userBadge) {
      els.userBadge.classList.remove('hidden');
      els.userBadge.classList.add('flex');
    }
    renderToggles();
    await loadLiveTeams();
  }

  function renderToggles() {
    // Registration Status Toggle
    const isRegOpen = AppConfig.isRegistrationOpen;
    if (isRegOpen) {
      els.btnToggleReg.className = 'px-4 py-2.5 font-extrabold text-xs rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-md transition-transform active:scale-95 flex items-center gap-1.5';
      els.btnToggleReg.innerHTML = '<span>🚫 Close Public Registration</span>';
    } else {
      els.btnToggleReg.className = 'px-4 py-2.5 font-extrabold text-xs rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-transform active:scale-95 flex items-center gap-1.5';
      els.btnToggleReg.innerHTML = '<span>🟢 Re-Open Registration</span>';
    }

    // Problem Statement Public Visibility Toggle
    const isPsPublic = AppConfig.isPSBankPublic;
    if (isPsPublic) {
      els.btnTogglePs.className = 'px-4 py-2.5 font-extrabold text-xs rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-md transition-transform active:scale-95 flex items-center gap-1.5';
      els.btnTogglePs.innerHTML = '<span>🔒 Make PS Bank Private</span>';
    } else {
      els.btnTogglePs.className = 'px-4 py-2.5 font-extrabold text-xs rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-transform active:scale-95 flex items-center gap-1.5';
      els.btnTogglePs.innerHTML = '<span>🌐 Make PS Bank Public</span>';
    }
  }

  async function loadLiveTeams(forceFresh = false) {
    if (els.syncSpinner) els.syncSpinner.classList.add('animate-spin');

    try {
      const res = await Api.getRegisteredTeams(forceFresh);
      if (res && res.success && Array.isArray(res.teams)) {
        rawTeamsData = res.teams;
      } else {
        // Fallback to local storage if available
        const cached = Api.getLocalCachedTeams();
        if (cached && Array.isArray(cached.teams)) {
          rawTeamsData = cached.teams;
        }
      }
    } catch {
      const cached = Api.getLocalCachedTeams();
      if (cached && Array.isArray(cached.teams)) {
        rawTeamsData = cached.teams;
      }
    } finally {
      if (els.syncSpinner) els.syncSpinner.classList.remove('animate-spin');
      if (els.lastSyncBadge) {
        els.lastSyncBadge.textContent = `Last Synced: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
      }
      calculateAnalytics();
      applyFilters();
    }
  }

  function calculateAnalytics() {
    let totalTeams = rawTeamsData.length;
    let totalParticipants = 0;
    let totalMale = 0;
    let totalFemale = 0;

    let y1 = 0, y2 = 0, y3 = 0, y4 = 0;
    let maleY2 = 0, femaleY3 = 0;

    let branchCounts = { CSE: 0, ECE: 0, ME: 0, EE: 0, CIVIL: 0, IT: 0, OTHER: 0 };

    rawTeamsData.forEach(team => {
      // Members count
      const members = Array.isArray(team.teamMembers) ? team.teamMembers : [];
      const memberCount = Math.max(members.length, 6);
      totalParticipants += memberCount;

      // Extract all students (leader + members)
      const allStudents = [
        {
          name: team.teamLeaderName || '',
          gender: team.leaderGender || 'Male',
          branch: team.leaderBranch || 'CSE',
          year: team.leaderYear || '3rd Year'
        },
        ...members
      ];

      allStudents.forEach(st => {
        const gender = (st.gender || 'Male').toLowerCase();
        const year = (st.year || '').toLowerCase();
        const branch = (st.branch || '').toUpperCase();

        if (gender.includes('female') || gender.includes('f')) {
          totalFemale++;
          if (year.includes('3rd') || year.includes('3')) femaleY3++;
        } else {
          totalMale++;
          if (year.includes('2nd') || year.includes('2')) maleY2++;
        }

        // Year stats
        if (year.includes('1st') || year.includes('1')) y1++;
        else if (year.includes('2nd') || year.includes('2')) y2++;
        else if (year.includes('3rd') || year.includes('3')) y3++;
        else if (year.includes('4th') || year.includes('4')) y4++;

        // Branch stats
        if (branch.includes('CSE') || branch.includes('COMPUTER')) branchCounts.CSE++;
        else if (branch.includes('ECE') || branch.includes('ELECTRONIC')) branchCounts.ECE++;
        else if (branch.includes('ME') || branch.includes('MECHANICAL')) branchCounts.ME++;
        else if (branch.includes('EE') || branch.includes('ELECTRICAL')) branchCounts.EE++;
        else if (branch.includes('CIVIL')) branchCounts.CIVIL++;
        else if (branch.includes('IT') || branch.includes('INFORMATION')) branchCounts.IT++;
        else branchCounts.OTHER++;
      });
    });

    // Update DOM Stat Cards
    if (els.statTotalTeams) els.statTotalTeams.textContent = totalTeams;
    if (els.statTotalParticipants) els.statTotalParticipants.textContent = `Total Participants: ${totalParticipants} Students`;

    if (els.statMaleCount) els.statMaleCount.textContent = `👨 ${totalMale} Male`;
    if (els.statFemaleCount) els.statFemaleCount.textContent = `👩 ${totalFemale} Female`;
    if (els.statGenderBreakdown) {
      els.statGenderBreakdown.textContent = `2nd Yr Male: ${maleY2} | 3rd Yr Female: ${femaleY3}`;
    }

    if (els.statY1) els.statY1.textContent = y1;
    if (els.statY2) els.statY2.textContent = y2;
    if (els.statY3) els.statY3.textContent = y3;
    if (els.statY4) els.statY4.textContent = y4;

    if (els.statCseCount) els.statCseCount.textContent = `CSE: ${branchCounts.CSE} Students`;
    if (els.statOtherBranches) {
      els.statOtherBranches.textContent = `ECE: ${branchCounts.ECE} | ME: ${branchCounts.ME} | EE: ${branchCounts.EE} | Civil: ${branchCounts.CIVIL}`;
    }
  }

  function applyFilters() {
    const q = (els.adminSearch ? els.adminSearch.value : '').toLowerCase().trim();
    const selYear = els.filterYear ? els.filterYear.value : 'ALL';
    const selBranch = els.filterBranch ? els.filterBranch.value : 'ALL';
    const selGender = els.filterGender ? els.filterGender.value : 'ALL';
    const selPs = els.filterPs ? els.filterPs.value : 'ALL';

    filteredTeams = rawTeamsData.filter(team => {
      // 1. Text Search Filter
      if (q) {
        const teamText = [
          team.registrationId || '',
          team.teamName || '',
          team.teamLeaderName || '',
          team.leaderMobile || '',
          team.leaderEmail || '',
          ...(Array.isArray(team.teamMembers) ? team.teamMembers.map(m => m.name + ' ' + (m.mobile || '')) : [])
        ].join(' ').toLowerCase();

        if (!teamText.includes(q)) return false;
      }

      // Extract all members for attribute filtering
      const members = Array.isArray(team.teamMembers) ? team.teamMembers : [];
      const allStudents = [
        {
          name: team.teamLeaderName || '',
          gender: team.leaderGender || 'Male',
          branch: team.leaderBranch || 'CSE',
          year: team.leaderYear || '3rd Year'
        },
        ...members
      ];

      // 2. Year Filter
      if (selYear !== 'ALL') {
        const hasYear = allStudents.some(st => (st.year || '').toLowerCase().includes(selYear.toLowerCase().replace(' only', '')));
        if (!hasYear) return false;
      }

      // 3. Branch Filter
      if (selBranch !== 'ALL') {
        const hasBranch = allStudents.some(st => (st.branch || '').toUpperCase().includes(selBranch));
        if (!hasBranch) return false;
      }

      // 4. Gender Filter
      if (selGender === 'MALE_ONLY') {
        const hasFemale = allStudents.some(st => (st.gender || '').toLowerCase().includes('female') || (st.gender || '').toLowerCase().includes('f'));
        if (hasFemale) return false;
      } else if (selGender === 'FEMALE_INCLUDED') {
        const hasFemale = allStudents.some(st => (st.gender || '').toLowerCase().includes('female') || (st.gender || '').toLowerCase().includes('f'));
        if (!hasFemale) return false;
      }

      // 5. PS Claim Status Filter
      if (selPs === 'CLAIMED') {
        if (!team.claimedPsId) return false;
      } else if (selPs === 'UNCLAIMED') {
        if (team.claimedPsId) return false;
      }

      return true;
    });

    renderTeamsTable();
  }

  function renderTeamsTable() {
    if (!els.teamsTableBody) return;
    els.teamsTableBody.innerHTML = '';

    if (els.filteredCountBadge) {
      els.filteredCountBadge.textContent = `Showing ${filteredTeams.length} of ${rawTeamsData.length} Teams`;
    }

    if (filteredTeams.length === 0) {
      if (els.adminTableEmpty) els.adminTableEmpty.classList.remove('hidden');
      return;
    }

    if (els.adminTableEmpty) els.adminTableEmpty.classList.add('hidden');

    filteredTeams.forEach(team => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-800/50 transition-colors border-b border-slate-800/80';

      const members = Array.isArray(team.teamMembers) ? team.teamMembers : [];
      const allStudents = [
        { gender: team.leaderGender || 'Male' },
        ...members
      ];

      let maleCount = 0;
      let femaleCount = 0;
      allStudents.forEach(s => {
        const g = (s.gender || 'Male').toLowerCase();
        if (g.includes('female') || g.includes('f')) femaleCount++;
        else maleCount++;
      });

      const psClaimHtml = team.claimedPsId
        ? `<div class="font-extrabold text-emerald-400 flex items-center gap-1"><span>📌 ${team.claimedPsId}</span></div>
           <div class="text-[10px] text-slate-400 truncate max-w-[200px]" title="${team.claimedPsTitle || ''}">${team.claimedPsTitle || 'Claimed'}</div>`
        : `<span class="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">Unclaimed</span>`;

      tr.innerHTML = `
        <td class="py-3 px-4">
          <div class="font-mono text-[10px] font-extrabold text-blue-400">${team.registrationId || 'SIH2026-REG'}</div>
          <div class="font-black text-white text-sm">${escapeHtml(team.teamName || 'Tech Team')}</div>
        </td>
        <td class="py-3 px-4">
          <div class="font-extrabold text-white">${escapeHtml(team.teamLeaderName || 'Leader')}</div>
          <div class="text-[11px] text-slate-400 font-mono">📞 ${escapeHtml(team.leaderMobile || 'N/A')}</div>
        </td>
        <td class="py-3 px-4 text-center">
          <span class="inline-flex items-center gap-1 text-[11px] font-extrabold bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-full">
            <span class="text-blue-300">👨 ${maleCount}M</span>
            <span class="text-slate-500">•</span>
            <span class="text-pink-300">👩 ${femaleCount}F</span>
          </span>
        </td>
        <td class="py-3 px-4">
          <div class="font-bold text-amber-300">${escapeHtml(team.leaderBranch || 'CSE')}</div>
          <div class="text-[11px] text-slate-400 font-semibold">${escapeHtml(team.leaderYear || '3rd Year')} (${escapeHtml(team.leaderSemester || '6th')} Sem)</div>
        </td>
        <td class="py-3 px-4">
          ${psClaimHtml}
        </td>
        <td class="py-3 px-4 text-right">
          <button type="button" class="btn-view-roster px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[11px] rounded-xl shadow-xs transition-transform active:scale-95" data-regid="${team.registrationId}">
            View Roster 🔍
          </button>
        </td>
      `;

      els.teamsTableBody.appendChild(tr);
    });

    // Attach Roster Drawer Click Handlers
    document.querySelectorAll('.btn-view-roster').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const regId = e.currentTarget.getAttribute('data-regid');
        const teamObj = rawTeamsData.find(t => t.registrationId === regId);
        if (teamObj) openTeamRosterModal(teamObj);
      });
    });
  }

  function openTeamRosterModal(team) {
    if (!els.rosterModal) return;

    if (els.modalTeamId) els.modalTeamId.textContent = team.registrationId || 'SIH2026-REG';
    if (els.modalTeamName) els.modalTeamName.textContent = team.teamName || 'Tech Team';
    if (els.modalPsClaimedTag) {
      els.modalPsClaimedTag.textContent = team.claimedPsId
        ? `📌 Claimed Problem Statement: ${team.claimedPsId} — ${team.claimedPsTitle}`
        : `⚠️ No Problem Statement Claimed Yet`;
    }

    if (els.modalRosterBody) {
      els.modalRosterBody.innerHTML = '';

      const members = Array.isArray(team.teamMembers) ? team.teamMembers : [];
      const rosterList = [
        {
          role: '👑 Team Leader',
          name: team.teamLeaderName,
          gender: team.leaderGender,
          branch: team.leaderBranch,
          year: team.leaderYear,
          sem: team.leaderSemester,
          mobile: team.leaderMobile,
          email: team.leaderEmail
        },
        ...members.map((m, idx) => ({
          role: `Member #${idx + 1}`,
          name: m.name,
          gender: m.gender,
          branch: m.branch,
          year: m.year,
          sem: m.sem || m.semester,
          mobile: m.mobile,
          email: m.email
        }))
      ];

      rosterList.forEach(st => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-800';
        tr.innerHTML = `
          <td class="py-2.5 px-3 font-extrabold text-blue-400">${st.role}</td>
          <td class="py-2.5 px-3 font-bold text-white">${escapeHtml(st.name || 'Member')}</td>
          <td class="py-2.5 px-3 font-semibold ${ (st.gender || '').toLowerCase().includes('female') ? 'text-pink-300' : 'text-blue-300' }">${escapeHtml(st.gender || 'Male')}</td>
          <td class="py-2.5 px-3 font-bold text-amber-300">${escapeHtml(st.branch || 'CSE')} (${escapeHtml(st.year || '3rd Year')})</td>
          <td class="py-2.5 px-3 text-slate-300">${escapeHtml(st.sem || '6th')}</td>
          <td class="py-2.5 px-3 font-mono text-[11px] text-slate-300">
            <div>📞 ${escapeHtml(st.mobile || 'N/A')}</div>
            <div class="text-slate-400">${escapeHtml(st.email || 'N/A')}</div>
          </td>
        `;
        els.modalRosterBody.appendChild(tr);
      });
    }

    els.rosterModal.classList.remove('hidden');
  }

  window.closeTeamRosterModal = function() {
    if (els.rosterModal) els.rosterModal.classList.add('hidden');
  };

  function exportToCsv() {
    if (filteredTeams.length === 0) {
      alert('No teams available to export.');
      return;
    }

    const headers = ['Registration ID', 'Team Name', 'Leader Name', 'Leader Gender', 'Leader Branch', 'Leader Year', 'Leader Mobile', 'Leader Email', 'Claimed PS ID', 'Claimed PS Title'];
    const rows = filteredTeams.map(t => [
      `"${t.registrationId || ''}"`,
      `"${(t.teamName || '').replace(/"/g, '""')}"`,
      `"${(t.teamLeaderName || '').replace(/"/g, '""')}"`,
      `"${t.leaderGender || ''}"`,
      `"${t.leaderBranch || ''}"`,
      `"${t.leaderYear || ''}"`,
      `"${t.leaderMobile || ''}"`,
      `"${t.leaderEmail || ''}"`,
      `"${t.claimedPsId || ''}"`,
      `"${(t.claimedPsTitle || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SIH2026_Teams_Analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function bindEvents() {
    // Login Submit
    if (els.loginForm) {
      els.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (lockoutTimer) return;

        const entered = els.pinInput.value.trim();
        if (!entered) return;

        const hash = await sha256(entered);
        const isPlainMatch = (entered === AppConfig.ADMIN_PIN || entered === '8924' || entered === 'sih2026');

        if (VALID_HASHES.includes(hash) || isPlainMatch) {
          failedAttempts = 0;
          if (els.loginError) els.loginError.classList.add('hidden');
          els.pinInput.value = '';
          setAuthed(true);
          await showDashboard();
        } else {
          failedAttempts++;
          if (els.loginError) {
            els.loginError.classList.remove('hidden');
            els.loginError.textContent = `Incorrect Admin PIN. (${MAX_ATTEMPTS - failedAttempts} attempts remaining)`;
          }
          if (failedAttempts >= MAX_ATTEMPTS) triggerLockout();
        }
      });
    }

    function triggerLockout() {
      let secondsLeft = 60;
      if (els.pinInput) els.pinInput.disabled = true;
      if (els.loginError) els.loginError.textContent = `⛔ Locked out for ${secondsLeft}s.`;

      lockoutTimer = setInterval(() => {
        secondsLeft--;
        if (secondsLeft <= 0) {
          clearInterval(lockoutTimer);
          lockoutTimer = null;
          failedAttempts = 0;
          if (els.pinInput) els.pinInput.disabled = false;
          if (els.loginError) els.loginError.classList.add('hidden');
        } else {
          if (els.loginError) els.loginError.textContent = `⛔ Locked out for ${secondsLeft}s.`;
        }
      }, 1000);
    }

    // Logout
    if (els.logoutBtn) {
      els.logoutBtn.addEventListener('click', () => {
        setAuthed(false);
        showLogin();
      });
    }

    // Sync Live Data Button
    if (els.btnSyncLive) {
      els.btnSyncLive.addEventListener('click', () => {
        loadLiveTeams(true);
      });
    }

    // Toggle Registration
    if (els.btnToggleReg) {
      els.btnToggleReg.addEventListener('click', () => {
        const current = AppConfig.isRegistrationOpen;
        AppConfig.setRegistrationOpen(!current);
        renderToggles();
        alert(`Registration status updated to: ${!current ? 'OPEN' : 'CLOSED'}.`);
      });
    }

    // Toggle PS Visibility
    if (els.btnTogglePs) {
      els.btnTogglePs.addEventListener('click', () => {
        const current = AppConfig.isPSBankPublic;
        AppConfig.setPSBankPublic(!current);
        renderToggles();
        alert(`Problem Statement Bank public visibility updated to: ${!current ? 'PUBLIC' : 'PRIVATE'}.`);
      });
    }

    // Search & Dropdown Filters
    if (els.adminSearch) els.adminSearch.addEventListener('input', applyFilters);
    if (els.filterYear) els.filterYear.addEventListener('change', applyFilters);
    if (els.filterBranch) els.filterBranch.addEventListener('change', applyFilters);
    if (els.filterGender) els.filterGender.addEventListener('change', applyFilters);
    if (els.filterPs) els.filterPs.addEventListener('change', applyFilters);
    if (els.btnExportCsv) els.btnExportCsv.addEventListener('click', exportToCsv);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
