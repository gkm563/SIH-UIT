/**
 * SIH 2026 Registered Teams Showcase Portal
 */
(() => {
  'use strict';

  const els = {
    searchInput: document.getElementById('search-input'),
    btnClearSearch: document.getElementById('btn-clear-search'),
    availabilityBadge: document.getElementById('availability-badge'),
    teamsCountBadge: document.getElementById('teams-count-badge'),
    btnRefresh: document.getElementById('btn-refresh-teams'),
    teamsGrid: document.getElementById('teams-grid')
  };

  let allTeams = [];
  let isLoading = false;

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'Registered';
    try {
      const d = new Date(dateStr.replace(/-/g, '/'));
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  function renderLoadingState() {
    els.teamsGrid.innerHTML = `
      <div class="team-card animate-pulse bg-white border border-gray-200 rounded-xl p-4">
        <div class="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div class="h-3 bg-gray-100 rounded w-1/2 mb-2"></div>
        <div class="h-3 bg-gray-100 rounded w-1/3"></div>
      </div>
      <div class="team-card animate-pulse bg-white border border-gray-200 rounded-xl p-4">
        <div class="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div class="h-3 bg-gray-100 rounded w-1/2 mb-2"></div>
        <div class="h-3 bg-gray-100 rounded w-1/3"></div>
      </div>`;
    els.teamsCountBadge.textContent = 'Loading…';
  }

  function renderErrorState(msg) {
    els.teamsGrid.innerHTML = `
      <div class="col-span-full bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center shadow-xs">
        <svg class="w-8 h-8 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="font-bold text-sm mb-1">${escapeHtml(msg || 'Unable to load registered teams.')}</p>
        <p class="text-xs text-red-600 mb-4">Check your internet connection or try again in a few moments.</p>
        <button id="btn-retry-teams" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95 shadow-xs">
          Try Again
        </button>
      </div>`;
    els.teamsCountBadge.textContent = '0 Teams';

    const retryBtn = document.getElementById('btn-retry-teams');
    if (retryBtn) retryBtn.addEventListener('click', loadTeams);
  }

  function renderTeamsList(teamsToDisplay) {
    if (!teamsToDisplay || teamsToDisplay.length === 0) {
      const isSearching = els.searchInput.value.trim().length > 0;
      els.teamsGrid.innerHTML = `
        <div class="col-span-full bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center shadow-xs">
          <div class="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p class="font-bold text-gray-800 text-sm mb-1">${isSearching ? 'No Matching Team Found' : 'No Teams Registered Yet'}</p>
          <p class="text-xs text-gray-500 max-w-md mx-auto mb-4">${isSearching ? 'No team currently matches your search query. You can use this team name!' : 'Be the first team to register for SIH 2026!'}</p>
          ${isSearching ? `<button id="btn-reset-search" class="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors">Clear Search Filter</button>` : ''}
        </div>`;

      const resetBtn = document.getElementById('btn-reset-search');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          els.searchInput.value = '';
          handleSearchAndCheck();
        });
      }
      return;
    }

    const html = teamsToDisplay.map((team, idx) => {
      const serialNum = idx + 1;
      const regId = escapeHtml(team.registrationId || `SIH2026-${serialNum}`);
      const name = escapeHtml(team.teamName || 'Unnamed Team');
      const dateStr = escapeHtml(formatDate(team.timestamp));

      return `
        <div class="team-card bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs hover:shadow-md transition-all">
          <div class="flex items-start justify-between gap-2 mb-2.5">
            <div class="flex items-start gap-2.5 min-w-0">
              <span class="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-extrabold text-xs flex-shrink-0 mt-0.5 border border-slate-200/80" title="Team #${serialNum}">
                ${serialNum}
              </span>
              <h3 class="font-extrabold text-gray-900 text-sm sm:text-base leading-snug tracking-tight">${name}</h3>
            </div>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200/80 flex-shrink-0">
              ${regId}
            </span>
          </div>

          <div class="flex items-center justify-between text-xs text-gray-500 pt-2.5 border-t border-gray-100">
            <div class="flex items-center gap-1.5 text-[11px] text-gray-500">
              <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>${dateStr}</span>
            </div>
            <span class="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              <svg class="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Verified
            </span>
          </div>
        </div>`;
    }).join('');

    els.teamsGrid.innerHTML = html;
  }

  function handleSearchAndCheck() {
    const rawQuery = els.searchInput.value || '';
    const query = rawQuery.trim().toLowerCase();

    if (els.btnClearSearch) {
      els.btnClearSearch.classList.toggle('hidden', rawQuery.length === 0);
    }

    if (!query) {
      els.availabilityBadge.classList.add('hidden');
      els.availabilityBadge.innerHTML = '';
      renderTeamsList(allTeams);
      els.teamsCountBadge.textContent = `${allTeams.length} ${allTeams.length === 1 ? 'Team' : 'Teams'}`;
      return;
    }

    // Filter teams list
    const filtered = allTeams.filter((t) => {
      const name = String(t.teamName || '').toLowerCase();
      const id = String(t.registrationId || '').toLowerCase();
      return name.includes(query) || id.includes(query);
    });

    renderTeamsList(filtered);
    els.teamsCountBadge.textContent = `${filtered.length} of ${allTeams.length} ${allTeams.length === 1 ? 'Team' : 'Teams'}`;

    // Availability Badge Checks
    els.availabilityBadge.classList.remove('hidden');

    // 1. Check SIH Rule: Institute Name
    if (query.includes('uit') || query.includes('united')) {
      els.availabilityBadge.className = 'mt-3 p-3 rounded-xl text-xs bg-amber-50 text-amber-900 border border-amber-300 flex items-start gap-2 shadow-2xs';
      els.availabilityBadge.innerHTML = `
        <svg class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <div>
          <strong>SIH Rule Alert:</strong> Team name must <u>not contain</u> institute name ("United" / "UIT"). Please remove it.
        </div>`;
      return;
    }

    // 2. Check Duplicate Team Name
    const exactMatch = allTeams.find((t) => String(t.teamName || '').trim().toLowerCase() === query);

    if (exactMatch) {
      els.availabilityBadge.className = 'mt-3 p-3 rounded-xl text-xs bg-red-50 text-red-900 border border-red-200 flex items-start gap-2 shadow-2xs';
      els.availabilityBadge.innerHTML = `
        <svg class="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <div>
          <strong>Already Registered:</strong> "${escapeHtml(exactMatch.teamName)}" is taken (${escapeHtml(exactMatch.registrationId)}). Try something like <em>"${escapeHtml(rawQuery.trim())} 2026"</em> or <em>"Tech ${escapeHtml(rawQuery.trim())}"</em>.
        </div>`;
    } else {
      els.availabilityBadge.className = 'mt-3 p-3 rounded-xl text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-start gap-2 shadow-2xs badge-pulse';
      els.availabilityBadge.innerHTML = `
        <svg class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        <div>
          <strong>✨ 100% Unique &amp; Available!</strong> No team is registered as "${escapeHtml(rawQuery.trim())}". You can use this for your team!
        </div>`;
    }
  }

  async function loadTeams(showLoadingSkeleton = true) {
    if (isLoading) return;
    isLoading = true;

    // 1. Instant Cache Display (0ms response time)
    const cachedData = Api.getLocalCachedTeams && Api.getLocalCachedTeams();
    if (cachedData && cachedData.success && Array.isArray(cachedData.teams) && cachedData.teams.length > 0) {
      allTeams = cachedData.teams;
      els.teamsCountBadge.textContent = `${allTeams.length} ${allTeams.length === 1 ? 'Team' : 'Teams'}`;
      handleSearchAndCheck();
      showLoadingSkeleton = false; // Already showing cached teams, no need for skeleton
    }

    // 2. Local Submission Recovery (If user registered on this browser)
    if (typeof Storage !== 'undefined' && Storage.loadSubmission) {
      const mySub = Storage.loadSubmission();
      if (mySub && mySub.registrationId && mySub.fields && mySub.fields.teamName) {
        const exists = allTeams.some(t => String(t.registrationId) === String(mySub.registrationId) || String(t.teamName).toLowerCase() === String(mySub.fields.teamName).toLowerCase());
        if (!exists) {
          const myTeam = {
            registrationId: mySub.registrationId,
            teamName: mySub.fields.teamName,
            leaderName: mySub.fields.leader_fullName || mySub.fields.leader_name || 'Team Leader',
            branch: mySub.fields.leader_branch || 'CSE',
            year: mySub.fields.leader_year || 'Third Year',
            submittedAt: mySub.submittedAtDisplay || 'Just Now'
          };
          allTeams = [myTeam, ...allTeams];
        }
      }
    }

    if (showLoadingSkeleton && (!allTeams || allTeams.length === 0)) {
      renderLoadingState();
    }

    try {
      const res = await Api.getRegisteredTeams(true);
      if (res && res.success && Array.isArray(res.teams) && res.teams.length > 0) {
        allTeams = res.teams;
        els.teamsCountBadge.textContent = `${allTeams.length} ${allTeams.length === 1 ? 'Team' : 'Teams'}`;
        handleSearchAndCheck();
      } else if (!allTeams || allTeams.length === 0) {
        renderErrorState(res.message || 'Connecting to Google Sheets database…');
      }
    } catch (err) {
      if (!allTeams || allTeams.length === 0) {
        renderErrorState('Network connection busy. Retrying in a moment…');
      }
    } finally {
      isLoading = false;
    }
  }

  function init() {
    loadTeams(true);

    if (els.searchInput) {
      els.searchInput.addEventListener('input', handleSearchAndCheck);
    }
    if (els.btnClearSearch) {
      els.btnClearSearch.addEventListener('click', () => {
        els.searchInput.value = '';
        handleSearchAndCheck();
        els.searchInput.focus();
      });
    }
    if (els.btnRefresh) {
      els.btnRefresh.addEventListener('click', () => loadTeams(true));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
