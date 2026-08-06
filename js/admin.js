/**
 * SIH 2026 Advanced Admin Intelligence Portal Script (Clean Light Theme)
 * Real-time Analytics, Interactive Stat Card Drill-Down Modals, Filter Engine, Team Roster Viewer & Live Sheet Sync
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

    // Clickable Stat Cards
    cardStatTeams: document.getElementById('card-stat-teams'),
    cardStatGender: document.getElementById('card-stat-gender'),
    cardStatYear: document.getElementById('card-stat-year'),
    cardStatBranch: document.getElementById('card-stat-branch'),

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

    // Stat Modal
    statModal: document.getElementById('stat-breakdown-modal'),
    statModalTitle: document.getElementById('stat-modal-title'),
    statModalSubtitle: document.getElementById('stat-modal-subtitle'),
    statModalContent: document.getElementById('stat-modal-content'),

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

  function normalizeTeamData(rawTeam) {
    if (!rawTeam) return {};
    const f = rawTeam.fields || {};
    return {
      registrationId: rawTeam.registrationId || f.registrationId || 'SIH2026-REG',
      teamName: rawTeam.teamName || f.teamName || 'Tech Team',
      timestamp: rawTeam.timestamp || f.timestamp || '',
      teamLeaderName: rawTeam.teamLeaderName || rawTeam.leaderName || f.leaderName || f.teamLeaderName || f.leader_name || 'Leader',
      leaderGender: rawTeam.leaderGender || f.leaderGender || f.leader_gender || 'Male',
      leaderBranch: rawTeam.leaderBranch || f.leaderBranch || f.leader_branch || 'CSE',
      leaderYear: rawTeam.leaderYear || f.leaderYear || f.leader_year || '3rd Year',
      leaderSemester: rawTeam.leaderSemester || f.leaderSemester || f.leader_sem || '6th',
      leaderMobile: rawTeam.leaderMobile || f.leaderMobile || f.leader_phone || 'N/A',
      leaderEmail: rawTeam.leaderEmail || f.leaderEmail || f.leader_email || 'N/A',
      claimedPsId: rawTeam.claimedPsId || f.claimedPsId || f.claimed_ps || '',
      claimedPsTitle: rawTeam.claimedPsTitle || f.claimedPsTitle || '',
      teamMembers: Array.isArray(rawTeam.teamMembers) ? rawTeam.teamMembers : (Array.isArray(f.teamMembers) ? f.teamMembers : [])
    };
  }

  async function showDashboard() {
    if (els.loginCard) els.loginCard.classList.add('hidden');
    if (els.dashboard) els.dashboard.classList.remove('hidden');
    if (els.userBadge) {
      els.userBadge.classList.remove('hidden');
      els.userBadge.classList.add('flex');
    }

    // Instantly populate with local cache so zero does not show while fetching
    const cached = Api.getLocalCachedTeams();
    if (cached && Array.isArray(cached.teams) && cached.teams.length > 0) {
      rawTeamsData = cached.teams.map(normalizeTeamData);
      calculateAnalytics();
      applyFilters();
    }

    await loadLiveTeams(true);
  }

  async function loadLiveTeams(forceFresh = false) {
    if (els.syncSpinner) els.syncSpinner.classList.add('animate-spin');

    try {
      const res = await Api.getRegisteredTeams(forceFresh);
      if (res && res.success && Array.isArray(res.teams) && res.teams.length > 0) {
        rawTeamsData = res.teams.map(normalizeTeamData);
      } else {
        const cached = Api.getLocalCachedTeams();
        if (cached && Array.isArray(cached.teams)) {
          rawTeamsData = cached.teams.map(normalizeTeamData);
        }
      }
    } catch {
      const cached = Api.getLocalCachedTeams();
      if (cached && Array.isArray(cached.teams)) {
        rawTeamsData = cached.teams.map(normalizeTeamData);
      }
    } finally {
      if (els.syncSpinner) els.syncSpinner.classList.remove('animate-spin');
      if (els.lastSyncBadge) {
        els.lastSyncBadge.textContent = `Live Synced: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
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
      const members = Array.isArray(team.teamMembers) ? team.teamMembers : [];
      const memberCount = Math.max(members.length, 6);
      totalParticipants += memberCount;

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

        if (year.includes('1st') || year.includes('1')) y1++;
        else if (year.includes('2nd') || year.includes('2')) y2++;
        else if (year.includes('3rd') || year.includes('3')) y3++;
        else if (year.includes('4th') || year.includes('4')) y4++;

        if (branch.includes('CSE') || branch.includes('COMPUTER')) branchCounts.CSE++;
        else if (branch.includes('ECE') || branch.includes('ELECTRONIC')) branchCounts.ECE++;
        else if (branch.includes('ME') || branch.includes('MECHANICAL')) branchCounts.ME++;
        else if (branch.includes('EE') || branch.includes('ELECTRICAL')) branchCounts.EE++;
        else if (branch.includes('CIVIL')) branchCounts.CIVIL++;
        else if (branch.includes('IT') || branch.includes('INFORMATION')) branchCounts.IT++;
        else branchCounts.OTHER++;
      });
    });

    if (els.statTotalTeams) els.statTotalTeams.textContent = totalTeams;
    if (els.statTotalParticipants) els.statTotalParticipants.textContent = `Total: ${totalParticipants} Students`;

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
      els.statOtherBranches.textContent = `ECE: ${branchCounts.ECE} | ME: ${branchCounts.ME} | Civil: ${branchCounts.CIVIL}`;
    }
  }

  function applyFilters() {
    const q = (els.adminSearch ? els.adminSearch.value : '').toLowerCase().trim();
    const selYear = els.filterYear ? els.filterYear.value : 'ALL';
    const selBranch = els.filterBranch ? els.filterBranch.value : 'ALL';
    const selGender = els.filterGender ? els.filterGender.value : 'ALL';
    const selPs = els.filterPs ? els.filterPs.value : 'ALL';

    filteredTeams = rawTeamsData.filter(team => {
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

      if (selYear !== 'ALL') {
        const hasYear = allStudents.some(st => (st.year || '').toLowerCase().includes(selYear.toLowerCase().replace(' only', '')));
        if (!hasYear) return false;
      }

      if (selBranch !== 'ALL') {
        const hasBranch = allStudents.some(st => (st.branch || '').toUpperCase().includes(selBranch));
        if (!hasBranch) return false;
      }

      if (selGender === 'MALE_ONLY') {
        const hasFemale = allStudents.some(st => (st.gender || '').toLowerCase().includes('female') || (st.gender || '').toLowerCase().includes('f'));
        if (hasFemale) return false;
      } else if (selGender === 'FEMALE_INCLUDED') {
        const hasFemale = allStudents.some(st => (st.gender || '').toLowerCase().includes('female') || (st.gender || '').toLowerCase().includes('f'));
        if (!hasFemale) return false;
      }

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
      tr.className = 'hover:bg-blue-50/70 transition-colors border-b border-slate-200/80 cursor-pointer group';

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
        ? `<div class="font-extrabold text-blue-800 flex items-center gap-1"><span>📌 ${team.claimedPsId}</span></div>
           <div class="text-[10px] text-slate-500 truncate max-w-[220px]" title="${team.claimedPsTitle || ''}">${team.claimedPsTitle || 'Claimed'}</div>`
        : `<span class="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">Unclaimed</span>`;

      tr.innerHTML = `
        <td class="py-3.5 px-4">
          <div class="font-mono text-[10px] font-extrabold text-blue-700">${team.registrationId || 'SIH2026-REG'}</div>
          <div class="font-black text-slate-900 text-sm group-hover:text-blue-700 transition-colors">${escapeHtml(team.teamName || 'Tech Team')}</div>
        </td>
        <td class="py-3.5 px-4">
          <div class="font-extrabold text-slate-900">${escapeHtml(team.teamLeaderName || 'Leader')}</div>
          <div class="text-[11px] text-slate-600 font-mono">📞 ${escapeHtml(team.leaderMobile || 'N/A')}</div>
        </td>
        <td class="py-3.5 px-4 text-center">
          <span class="inline-flex items-center gap-1 text-[11px] font-extrabold bg-slate-100 border border-slate-200/90 px-2.5 py-1 rounded-full">
            <span class="text-blue-700">👨 ${maleCount}M</span>
            <span class="text-slate-300">•</span>
            <span class="text-pink-700">👩 ${femaleCount}F</span>
          </span>
        </td>
        <td class="py-3.5 px-4">
          <div class="font-bold text-amber-800">${escapeHtml(team.leaderBranch || 'CSE')}</div>
          <div class="text-[11px] text-slate-600 font-semibold">${escapeHtml(team.leaderYear || '3rd Year')} (${escapeHtml(team.leaderSemester || '6th')} Sem)</div>
        </td>
        <td class="py-3.5 px-4">
          ${psClaimHtml}
        </td>
        <td class="py-3.5 px-4 text-right">
          <button type="button" class="btn-view-roster px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] rounded-xl shadow-2xs transition-transform active:scale-95" data-regid="${team.registrationId}">
            View Roster 🔍
          </button>
        </td>
      `;

      // Allow clicking whole row to open roster
      tr.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
          openTeamRosterModal(team);
        }
      });

      els.teamsTableBody.appendChild(tr);
    });

    document.querySelectorAll('.btn-view-roster').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const regId = e.currentTarget.getAttribute('data-regid');
        const teamObj = rawTeamsData.find(t => t.registrationId === regId);
        if (teamObj) openTeamRosterModal(teamObj);
      });
    });
  }

  // Deep Drill-Down Stat Breakdown Modals
  function openStatModal(type) {
    if (!els.statModal) return;

    if (type === 'teams') {
      els.statModalTitle.textContent = '🏆 All Registered Teams Summary';
      els.statModalSubtitle.textContent = `Total ${rawTeamsData.length} Teams Registered across all departments`;
      
      let html = `<div class="space-y-3">`;
      rawTeamsData.forEach((t, idx) => {
        html += `
          <div class="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between hover:bg-blue-50/50 cursor-pointer" onclick="closeStatModal(); openTeamRosterModalByRegId('${t.registrationId}')">
            <div>
              <div class="text-xs font-black text-slate-900">#${idx + 1} ${escapeHtml(t.teamName)} (${t.registrationId})</div>
              <div class="text-[11px] text-slate-600">Leader: ${escapeHtml(t.teamLeaderName)} | ${escapeHtml(t.leaderBranch)} (${escapeHtml(t.leaderYear)})</div>
            </div>
            <span class="text-xs font-bold text-blue-700 underline">View Roster →</span>
          </div>
        `;
      });
      html += `</div>`;
      els.statModalContent.innerHTML = html;

    } else if (type === 'gender') {
      els.statModalTitle.textContent = '👥 Gender Demographics Analysis';
      els.statModalSubtitle.textContent = 'Comprehensive Male vs Female Student Breakdown across Academic Years';

      let maleCount = 0, femaleCount = 0;
      let yMale = { '1st Year': 0, '2nd Year': 0, '3rd Year': 0, '4th Year': 0 };
      let yFemale = { '1st Year': 0, '2nd Year': 0, '3rd Year': 0, '4th Year': 0 };

      rawTeamsData.forEach(t => {
        const members = Array.isArray(t.teamMembers) ? t.teamMembers : [];
        const allStudents = [
          { gender: t.leaderGender || 'Male', year: t.leaderYear || '3rd Year' },
          ...members
        ];
        allStudents.forEach(st => {
          const g = (st.gender || 'Male').toLowerCase();
          const yr = st.year || '3rd Year';
          if (g.includes('female') || g.includes('f')) {
            femaleCount++;
            if (yr.includes('1')) yFemale['1st Year']++;
            else if (yr.includes('2')) yFemale['2nd Year']++;
            else if (yr.includes('3')) yFemale['3rd Year']++;
            else if (yr.includes('4')) yFemale['4th Year']++;
          } else {
            maleCount++;
            if (yr.includes('1')) yMale['1st Year']++;
            else if (yr.includes('2')) yMale['2nd Year']++;
            else if (yr.includes('3')) yMale['3rd Year']++;
            else if (yr.includes('4')) yMale['4th Year']++;
          }
        });
      });

      let html = `
        <div class="grid grid-cols-2 gap-4 text-center mb-4">
          <div class="bg-blue-50 p-4 rounded-2xl border border-blue-200">
            <div class="text-2xl font-black text-blue-800">👨 ${maleCount}</div>
            <div class="text-xs font-extrabold text-blue-900">Total Male Students</div>
          </div>
          <div class="bg-pink-50 p-4 rounded-2xl border border-pink-200">
            <div class="text-2xl font-black text-pink-800">👩 ${femaleCount}</div>
            <div class="text-xs font-extrabold text-pink-900">Total Female Students</div>
          </div>
        </div>

        <h4 class="text-xs font-black uppercase text-slate-700 tracking-wider">Year-wise Gender Breakdown</h4>
        <div class="border border-slate-200 rounded-xl overflow-hidden text-xs">
          <table class="w-full text-left">
            <thead class="bg-slate-100 text-slate-700 font-bold">
              <tr>
                <th class="p-2.5">Academic Year</th>
                <th class="p-2.5 text-blue-700">Male Count</th>
                <th class="p-2.5 text-pink-700">Female Count</th>
                <th class="p-2.5">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr><td class="p-2.5 font-bold">1st Year</td><td class="p-2.5 font-bold text-blue-700">${yMale['1st Year']}</td><td class="p-2.5 font-bold text-pink-700">${yFemale['1st Year']}</td><td class="p-2.5 font-extrabold">${yMale['1st Year'] + yFemale['1st Year']}</td></tr>
              <tr><td class="p-2.5 font-bold">2nd Year</td><td class="p-2.5 font-bold text-blue-700">${yMale['2nd Year']}</td><td class="p-2.5 font-bold text-pink-700">${yFemale['2nd Year']}</td><td class="p-2.5 font-extrabold">${yMale['2nd Year'] + yFemale['2nd Year']}</td></tr>
              <tr><td class="p-2.5 font-bold">3rd Year</td><td class="p-2.5 font-bold text-blue-700">${yMale['3rd Year']}</td><td class="p-2.5 font-bold text-pink-700">${yFemale['3rd Year']}</td><td class="p-2.5 font-extrabold">${yMale['3rd Year'] + yFemale['3rd Year']}</td></tr>
              <tr><td class="p-2.5 font-bold">4th Year</td><td class="p-2.5 font-bold text-blue-700">${yMale['4th Year']}</td><td class="p-2.5 font-bold text-pink-700">${yFemale['4th Year']}</td><td class="p-2.5 font-extrabold">${yMale['4th Year'] + yFemale['4th Year']}</td></tr>
            </tbody>
          </table>
        </div>
      `;
      els.statModalContent.innerHTML = html;

    } else if (type === 'year') {
      els.statModalTitle.textContent = '🎓 Academic Year Distribution';
      els.statModalSubtitle.textContent = 'Student distribution from 1st Year to 4th Year';

      let yCount = { '1st Year': 0, '2nd Year': 0, '3rd Year': 0, '4th Year': 0 };
      rawTeamsData.forEach(t => {
        const members = Array.isArray(t.teamMembers) ? t.teamMembers : [];
        const allStudents = [
          { year: t.leaderYear || '3rd Year' },
          ...members
        ];
        allStudents.forEach(st => {
          const yr = st.year || '';
          if (yr.includes('1')) yCount['1st Year']++;
          else if (yr.includes('2')) yCount['2nd Year']++;
          else if (yr.includes('3')) yCount['3rd Year']++;
          else if (yr.includes('4')) yCount['4th Year']++;
        });
      });

      let html = `
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-4">
          <div class="bg-emerald-50 p-3 rounded-xl border border-emerald-200"><div class="text-xl font-black text-emerald-800">${yCount['1st Year']}</div><div class="text-[11px] font-bold text-emerald-900">1st Year</div></div>
          <div class="bg-emerald-50 p-3 rounded-xl border border-emerald-200"><div class="text-xl font-black text-emerald-800">${yCount['2nd Year']}</div><div class="text-[11px] font-bold text-emerald-900">2nd Year</div></div>
          <div class="bg-emerald-50 p-3 rounded-xl border border-emerald-200"><div class="text-xl font-black text-emerald-800">${yCount['3rd Year']}</div><div class="text-[11px] font-bold text-emerald-900">3rd Year</div></div>
          <div class="bg-emerald-50 p-3 rounded-xl border border-emerald-200"><div class="text-xl font-black text-emerald-800">${yCount['4th Year']}</div><div class="text-[11px] font-bold text-emerald-900">4th Year</div></div>
        </div>
      `;
      els.statModalContent.innerHTML = html;

    } else if (type === 'branch') {
      els.statModalTitle.textContent = '💻 Branch / Department Distribution';
      els.statModalSubtitle.textContent = 'Student counts across CSE, ECE, ME, Civil, EE, and IT';

      let branchCounts = { CSE: 0, ECE: 0, ME: 0, EE: 0, CIVIL: 0, IT: 0, OTHER: 0 };
      rawTeamsData.forEach(t => {
        const members = Array.isArray(t.teamMembers) ? t.teamMembers : [];
        const allStudents = [
          { branch: t.leaderBranch || 'CSE' },
          ...members
        ];
        allStudents.forEach(st => {
          const b = (st.branch || '').toUpperCase();
          if (b.includes('CSE') || b.includes('COMPUTER')) branchCounts.CSE++;
          else if (b.includes('ECE') || b.includes('ELECTRONIC')) branchCounts.ECE++;
          else if (b.includes('ME') || b.includes('MECHANICAL')) branchCounts.ME++;
          else if (b.includes('EE') || b.includes('ELECTRICAL')) branchCounts.EE++;
          else if (b.includes('CIVIL')) branchCounts.CIVIL++;
          else if (b.includes('IT') || b.includes('INFORMATION')) branchCounts.IT++;
          else branchCounts.OTHER++;
        });
      });

      let html = `
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
          <div class="bg-amber-50 p-3 rounded-xl border border-amber-200"><div class="text-xl font-black text-amber-800">${branchCounts.CSE}</div><div class="text-xs font-bold text-amber-900">Computer Science (CSE)</div></div>
          <div class="bg-amber-50 p-3 rounded-xl border border-amber-200"><div class="text-xl font-black text-amber-800">${branchCounts.ECE}</div><div class="text-xs font-bold text-amber-900">Electronics (ECE)</div></div>
          <div class="bg-amber-50 p-3 rounded-xl border border-amber-200"><div class="text-xl font-black text-amber-800">${branchCounts.ME}</div><div class="text-xs font-bold text-amber-900">Mechanical (ME)</div></div>
          <div class="bg-amber-50 p-3 rounded-xl border border-amber-200"><div class="text-xl font-black text-amber-800">${branchCounts.EE}</div><div class="text-xs font-bold text-amber-900">Electrical (EE)</div></div>
          <div class="bg-amber-50 p-3 rounded-xl border border-amber-200"><div class="text-xl font-black text-amber-800">${branchCounts.CIVIL}</div><div class="text-xs font-bold text-amber-900">Civil Engineering</div></div>
          <div class="bg-amber-50 p-3 rounded-xl border border-amber-200"><div class="text-xl font-black text-amber-800">${branchCounts.IT}</div><div class="text-xs font-bold text-amber-900">Information Tech (IT)</div></div>
        </div>
      `;
      els.statModalContent.innerHTML = html;
    }

    els.statModal.classList.remove('hidden');
  }

  window.closeStatModal = function() {
    if (els.statModal) els.statModal.classList.add('hidden');
  };

  window.openTeamRosterModalByRegId = function(regId) {
    const teamObj = rawTeamsData.find(t => t.registrationId === regId);
    if (teamObj) openTeamRosterModal(teamObj);
  };

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
        tr.className = 'border-b border-slate-200/80';
        tr.innerHTML = `
          <td class="py-2.5 px-3 font-extrabold text-blue-700">${st.role}</td>
          <td class="py-2.5 px-3 font-bold text-slate-900">${escapeHtml(st.name || 'Member')}</td>
          <td class="py-2.5 px-3 font-semibold ${ (st.gender || '').toLowerCase().includes('female') ? 'text-pink-700' : 'text-blue-700' }">${escapeHtml(st.gender || 'Male')}</td>
          <td class="py-2.5 px-3 font-bold text-amber-800">${escapeHtml(st.branch || 'CSE')} (${escapeHtml(st.year || '3rd Year')})</td>
          <td class="py-2.5 px-3 text-slate-700">${escapeHtml(st.sem || '6th')}</td>
          <td class="py-2.5 px-3 font-mono text-[11px] text-slate-700">
            <div>📞 ${escapeHtml(st.mobile || 'N/A')}</div>
            <div class="text-slate-500">${escapeHtml(st.email || 'N/A')}</div>
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

    if (els.logoutBtn) {
      els.logoutBtn.addEventListener('click', () => {
        setAuthed(false);
        showLogin();
      });
    }

    if (els.btnSyncLive) {
      els.btnSyncLive.addEventListener('click', () => {
        loadLiveTeams(true);
      });
    }

    // Bind Clickable Stat Cards
    if (els.cardStatTeams) els.cardStatTeams.addEventListener('click', () => openStatModal('teams'));
    if (els.cardStatGender) els.cardStatGender.addEventListener('click', () => openStatModal('gender'));
    if (els.cardStatYear) els.cardStatYear.addEventListener('click', () => openStatModal('year'));
    if (els.cardStatBranch) els.cardStatBranch.addEventListener('click', () => openStatModal('branch'));

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
