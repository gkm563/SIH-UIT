/**
 * SIH 2026 Registered Teams Showcase Portal
 */
(() => {
  'use strict';

  const els = {
    searchInput: document.getElementById('search-input'),
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
      <div class="team-card animate-pulse bg-white border border-gray-200 rounded-lg p-4">
        <div class="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div class="h-3 bg-gray-100 rounded w-1/2 mb-2"></div>
        <div class="h-3 bg-gray-100 rounded w-1/3"></div>
      </div>
      <div class="team-card animate-pulse bg-white border border-gray-200 rounded-lg p-4">
        <div class="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div class="h-3 bg-gray-100 rounded w-1/2 mb-2"></div>
        <div class="h-3 bg-gray-100 rounded w-1/3"></div>
      </div>`;
    els.teamsCountBadge.textContent = 'Loading…';
  }

  function renderErrorState(msg) {
    els.teamsGrid.innerHTML = `
      <div class="col-span-full bg-red-50 border border-red-200 text-red-700 rounded-lg p-6 text-center">
        <svg class="w-8 h-8 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="font-semibold mb-1">${escapeHtml(msg || 'Unable to load registered teams.')}</p>
        <p class="text-xs text-red-600 mb-4">Check your internet connection or try again in a few moments.</p>
        <button id="btn-retry-teams" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md transition-colors">
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
        <div class="col-span-full bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
          <svg class="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p class="font-bold text-gray-700 text-sm mb-1">${isSearching ? 'No Matching Team Found' : 'No Teams Registered Yet'}</p>
          <p class="text-xs text-gray-500">${isSearching ? 'Try typing a different team name or search keyword.' : 'Be the first team to register for SIH 2026!'}</p>
        </div>`;
      return;
    }

    const html = teamsToDisplay.map((team, idx) => {
      const regId = escapeHtml(team.registrationId || `SIH2026-${idx + 1}`);
      const name = escapeHtml(team.teamName || 'Unnamed Team');
      const dateStr = escapeHtml(formatDate(team.timestamp));

      return `
        <div class="team-card bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all">
          <div class="flex items-start justify-between gap-2 mb-2">
            <h3 class="font-bold text-gray-900 text-base leading-snug text-blue-900">${name}</h3>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex-shrink-0">
              ${regId}
            </span>
          </div>

          <div class="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            <div class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>${dateStr}</span>
            </div>
            <span class="inline-flex items-center gap-1 text-emerald-700 font-medium">
              <svg class="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Registered
            </span>
          </div>
        </div>`;
    }).join('');

    els.teamsGrid.innerHTML = html;
  }

  function handleSearchAndCheck() {
    const rawQuery = els.searchInput.value || '';
    const query = rawQuery.trim().toLowerCase();

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

    // Availability Badge Check (exact match check)
    const exactMatch = allTeams.find((t) => String(t.teamName || '').trim().toLowerCase() === query);

    els.availabilityBadge.classList.remove('hidden');

    if (exactMatch) {
      els.availabilityBadge.className = 'mt-3 p-2.5 rounded-md text-xs bg-red-50 text-red-800 border border-red-200 flex items-center gap-2';
      els.availabilityBadge.innerHTML = `
        <svg class="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>
          <strong>Already Taken:</strong> "${escapeHtml(exactMatch.teamName)}" is registered (${escapeHtml(exactMatch.registrationId)}). Please choose a different team name!
        </span>`;
    } else {
      els.availabilityBadge.className = 'mt-3 p-2.5 rounded-md text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2';
      els.availabilityBadge.innerHTML = `
        <svg class="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>
          <strong>Available!</strong> No registered team is using the name "${escapeHtml(rawQuery.trim())}". You can use this for your team!
        </span>`;
    }
  }

  async function loadTeams() {
    if (isLoading) return;
    isLoading = true;
    renderLoadingState();

    try {
      const res = await Api.getRegisteredTeams();
      if (res && res.success && Array.isArray(res.teams)) {
        allTeams = res.teams;
        els.teamsCountBadge.textContent = `${allTeams.length} ${allTeams.length === 1 ? 'Team' : 'Teams'}`;
        handleSearchAndCheck();
      } else {
        renderErrorState(res.message || 'Could not retrieve registered teams list.');
      }
    } catch (err) {
      renderErrorState('Failed to fetch teams. Please try again.');
    } finally {
      isLoading = false;
    }
  }

  function init() {
    loadTeams();

    if (els.searchInput) {
      els.searchInput.addEventListener('input', handleSearchAndCheck);
    }
    if (els.btnRefresh) {
      els.btnRefresh.addEventListener('click', loadTeams);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
