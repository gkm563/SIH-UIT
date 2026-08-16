/**
 * SIH 2026 Problem Statement Bank Logic & UI Interactions
 */
(() => {
  'use strict';

  // Domain Color Palette Mapping
  const DOMAIN_STYLES = {
    'Agriculture': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'Healthcare': 'bg-rose-50 text-rose-800 border-rose-200',
    'Education': 'bg-blue-50 text-blue-800 border-blue-200',
    'Women Safety': 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200',
    'Disaster Management': 'bg-amber-50 text-amber-900 border-amber-200',
    'Smart City': 'bg-cyan-50 text-cyan-800 border-cyan-200',
    'Transportation': 'bg-indigo-50 text-indigo-800 border-indigo-200',
    'Waste Management': 'bg-lime-50 text-lime-900 border-lime-200',
    'Water Management': 'bg-teal-50 text-teal-800 border-teal-200',
    'Water Resources': 'bg-teal-50 text-teal-800 border-teal-200',
    'Renewable Energy': 'bg-amber-50 text-amber-900 border-amber-200',
    'Financial Inclusion': 'bg-violet-50 text-violet-800 border-violet-200',
    'AgriTech / MSME': 'bg-green-50 text-green-800 border-green-200',
    'Cybersecurity': 'bg-purple-50 text-purple-800 border-purple-200',
    'Assistive Tech': 'bg-pink-50 text-pink-800 border-pink-200',
    'Tourism & Culture': 'bg-yellow-50 text-yellow-900 border-yellow-200',
    'Governance': 'bg-sky-50 text-sky-800 border-sky-200',
    'Environment': 'bg-emerald-100 text-emerald-900 border-emerald-300',
    'Sports': 'bg-red-50 text-red-800 border-red-200',
    'Blockchain / GovTech': 'bg-slate-100 text-slate-800 border-slate-300',
    'AI/ML': 'bg-blue-100 text-blue-900 border-blue-300',
    'Robotics': 'bg-stone-100 text-stone-900 border-stone-300',
    'Open Innovation': 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-900 border-purple-300 font-extrabold shadow-2xs'
  };

  const DIFFICULTY_STYLES = {
    'Beginner': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Intermediate': 'bg-amber-50 text-amber-800 border-amber-200',
    'Advanced': 'bg-purple-50 text-purple-700 border-purple-200',
    'All Levels': 'bg-teal-50 text-teal-800 border-teal-200'
  };

  const TYPE_ICONS = {
    'Software': '🖥️',
    'Hardware': '⚙️',
    'Hybrid': '🔀',
    'Software / Hardware / Hybrid': '⚡'
  };

  // State
  let psCountsMap = {};
  const state = {
    search: '',
    type: 'All',
    difficulty: 'All',
    selectedDomains: new Set(),
    sortBy: 'default'   // 'default' | 'popular' | 'least' | 'zero'
  };



  // Fetch PS counts directly from Google Sheets public JSON API (no Apps Script needed)
  (async () => {
    try {
      const SHEET_ID = '1vbDZMAJJgZpELJpfGtdPCres5puMHxe3ac4vvLIoNbs';
      const SHEET_NAME = 'SIH 2026 Registrations';
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}&range=BK2:BK1000`;
      const res = await fetch(url);
      const text = await res.text();
      // Strip Google's JSONP wrapper: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
      const json = JSON.parse(text.replace(/^[^{]*/, '').replace(/\);?\s*$/, ''));
      const rows = json?.table?.rows || [];
      const counts = {};
      rows.forEach(row => {
        const val = (row?.c?.[0]?.v || '').trim().replace(/^'/, '');
        if (!val) return;
        // Extract PS-NN from start of string
        const m = val.match(/^(PS-?\d+)/i);
        if (!m) return;
        const num = parseInt(m[1].replace(/[^0-9]/g, ''), 10);
        const key = 'PS-' + (num < 10 ? '0' + num : num);
        counts[key] = (counts[key] || 0) + 1;
      });
      psCountsMap = counts;
      renderGrid();
    } catch (e) {
      // Fallback to PortalApi if direct fetch fails
      if (typeof PortalApi !== 'undefined') {
        PortalApi.getPSCounts().then(res => {
          if (res.success && res.counts) { psCountsMap = res.counts; renderGrid(); }
        }).catch(() => {});
      }
    }
  })();


  // DOM Elements
  const els = {
    search: document.getElementById('ps-search'),
    resultsCount: document.getElementById('ps-results-count'),
    resetBtn: document.getElementById('ps-reset-filters'),
    grid: document.getElementById('ps-grid'),
    emptyState: document.getElementById('ps-empty-state'),
    clearEmptyBtn: document.getElementById('btn-clear-empty'),
    domainChipsContainer: document.getElementById('domain-chips-container'),
    typeGroup: document.getElementById('type-filter-group'),
    difficultyGroup: document.getElementById('difficulty-filter-group'),
    sortGroup: document.getElementById('sort-filter-group'),
    
    // Detail Modal
    detailModal: document.getElementById('ps-detail-modal'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalPsId: document.getElementById('modal-ps-id'),
    modalPsDomain: document.getElementById('modal-ps-domain'),
    modalPsType: document.getElementById('modal-ps-type'),
    modalPsDiff: document.getElementById('modal-ps-diff'),
    modalPsTitle: document.getElementById('modal-ps-title'),
    modalPsDesc: document.getElementById('modal-ps-desc'),
    modalPsBeneficiaries: document.getElementById('modal-ps-beneficiaries')
  };

  /* ---------- Initialization ---------- */

  function init() {
    renderDomainChips();
    bindEvents();
    renderGrid();
    handleDeepLink();
  }

  function handleDeepLink() {
    const hash = window.location.hash ? window.location.hash.replace('#', '').trim().toUpperCase() : '';
    const params = new URLSearchParams(window.location.search);
    const psParam = params.get('ps') ? params.get('ps').trim().toUpperCase() : '';
    const targetId = psParam || hash;

    if (targetId) {
      const psMatch = typeof PROBLEM_STATEMENTS !== 'undefined' ? PROBLEM_STATEMENTS.find(p => p.id.toUpperCase() === targetId || p.id.toUpperCase().replace('-', '') === targetId.replace('-', '')) : null;
      if (psMatch) {
        setTimeout(() => {
          const card = document.querySelector(`[data-ps-id="${psMatch.id}"]`);
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          openDetailModal(psMatch.id);
        }, 350);
      }
    }
  }

  function getDomains() {
    const list = new Set();
    if (typeof PROBLEM_STATEMENTS !== 'undefined') {
      PROBLEM_STATEMENTS.forEach((ps) => list.add(ps.domain));
    }
    return Array.from(list).sort();
  }

  function renderDomainChips() {
    const domains = getDomains();
    let html = `
      <button type="button" class="domain-chip ${state.selectedDomains.size === 0 ? 'active' : ''}" data-domain="ALL">
        All Domains (${PROBLEM_STATEMENTS.length})
      </button>
    `;

    domains.forEach((d) => {
      const count = PROBLEM_STATEMENTS.filter((ps) => ps.domain === d).length;
      const isSelected = state.selectedDomains.has(d);
      const colorClass = DOMAIN_STYLES[d] || 'bg-slate-100 text-slate-700 border-slate-200';
      html += `
        <button type="button" class="domain-chip ${isSelected ? 'active' : ''} ${colorClass}" data-domain="${escapeHtml(d)}">
          <span>${escapeHtml(d)}</span>
          <span class="opacity-70 text-[10px]">(${count})</span>
        </button>
      `;
    });

    els.domainChipsContainer.innerHTML = html;
  }

  /* ---------- Grid Rendering ---------- */

  function filterStatements() {
    if (typeof PROBLEM_STATEMENTS === 'undefined') return [];

    let results = PROBLEM_STATEMENTS.filter((ps) => {
      // Search
      if (state.search) {
        const q = state.search.toLowerCase().trim();
        const matchId = ps.id.toLowerCase().includes(q);
        const matchTitle = ps.title.toLowerCase().includes(q);
        const matchDomain = ps.domain.toLowerCase().includes(q);
        const matchDesc = ps.problemStatement.toLowerCase().includes(q);

        if (!matchId && !matchTitle && !matchDomain && !matchDesc) return false;
      }

      // Type
      if (state.type !== 'All' && ps.type !== state.type && !ps.type.includes(state.type)) return false;

      // Difficulty
      if (state.difficulty !== 'All' && ps.difficulty !== state.difficulty && ps.difficulty !== 'All Levels') return false;

      // Domain
      if (state.selectedDomains.size > 0 && !state.selectedDomains.has(ps.domain)) return false;

      // Zero-teams filter
      if (state.sortBy === 'zero') {
        const c = (psCountsMap && psCountsMap[ps.id.toUpperCase()]) || 0;
        if (c > 0) return false;
      }

      return true;
    });

    // Apply sort
    if (state.sortBy === 'popular') {
      results = results.slice().sort((a, b) => {
        const ca = (psCountsMap && psCountsMap[a.id.toUpperCase()]) || 0;
        const cb = (psCountsMap && psCountsMap[b.id.toUpperCase()]) || 0;
        return cb - ca; // descending: highest first
      });
    } else if (state.sortBy === 'least') {
      results = results.slice().sort((a, b) => {
        const ca = (psCountsMap && psCountsMap[a.id.toUpperCase()]) || 0;
        const cb = (psCountsMap && psCountsMap[b.id.toUpperCase()]) || 0;
        return ca - cb; // ascending: lowest first
      });
    }
    // 'default' and 'zero' keep original order

    return results;
  }


  function renderGrid() {
    const filtered = filterStatements();

    // Results Counter Badge
    if (els.resultsCount) {
      els.resultsCount.textContent = `Showing ${filtered.length} of ${PROBLEM_STATEMENTS.length} Problem Statements`;
    }

    // Toggle Reset Filter Button Visibility
    const isFiltered =
      state.search !== '' || state.type !== 'All' || state.difficulty !== 'All' || state.selectedDomains.size > 0 || state.sortBy !== 'default';
    if (els.resetBtn) els.resetBtn.classList.toggle('hidden', !isFiltered);

    // Empty State
    if (filtered.length === 0) {
      els.grid.innerHTML = '';
      els.emptyState.classList.remove('hidden');
      return;
    }

    els.emptyState.classList.add('hidden');

    let html = '';
    filtered.forEach((ps) => {
      const domainStyle = DOMAIN_STYLES[ps.domain] || 'bg-slate-100 text-slate-700 border-slate-200';
      const diffStyle = DIFFICULTY_STYLES[ps.difficulty] || 'bg-slate-100 text-slate-700 border-slate-200';
      const icon = TYPE_ICONS[ps.type] || '💡';

      const summary =
        ps.problemStatement.length > 140
          ? ps.problemStatement.substring(0, 140) + '...'
          : ps.problemStatement;

      const count = (psCountsMap && psCountsMap[ps.id.toUpperCase()]) || 0;
      const countBadge = count > 0
        ? `<span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-950 border border-amber-300 flex items-center gap-1 shadow-2xs">🔥 ${count} Team${count > 1 ? 's' : ''}</span>`
        : `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200">👥 0 Teams</span>`;

      const isNewPs37 = ps.id === 'PS-37';
      const cardBorder = isNewPs37
        ? 'ps-card-featured rounded-2xl'
        : 'bg-white border border-slate-200/90 shadow-2xs hover:shadow-md rounded-2xl';

      const newBadge = isNewPs37
        ? `<span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-700 text-white shadow-2xs">💡 HIGH DEMAND</span>`
        : '';

      html += `
        <div class="ps-card ${cardBorder} rounded-2xl p-4 sm:p-5 transition-all flex flex-col justify-between cursor-pointer group hover:-translate-y-1 relative overflow-hidden" data-ps-id="${ps.id}">
          ${isNewPs37 ? '<div class="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>' : ''}
          <div>
            <!-- Top Meta Row -->
            <div class="flex items-center justify-between gap-2 mb-3">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full font-mono whitespace-nowrap flex-shrink-0">
                  ${ps.id}
                </span>
                ${newBadge}
              </div>
              <div class="flex items-center gap-1.5 flex-wrap justify-end">
                ${countBadge}
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${domainStyle}">${escapeHtml(ps.domain)}</span>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80">${icon} ${ps.type}</span>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${diffStyle}">${ps.difficulty}</span>
              </div>
            </div>

            <!-- Title -->
            <h3 class="text-sm sm:text-base font-extrabold ${isNewPs37 ? 'text-emerald-950 group-hover:text-emerald-700' : 'text-slate-900 group-hover:text-blue-600'} transition-colors leading-snug mb-2 flex items-center gap-1.5">
              ${escapeHtml(ps.title)}
            </h3>

            <!-- Summary -->
            <p class="text-xs text-slate-600 leading-relaxed font-normal mb-4">
              ${escapeHtml(summary)}
            </p>
          </div>

          <!-- Bottom Action Bar -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <span class="text-[11px] font-extrabold ${isNewPs37 ? 'text-purple-700 group-hover:underline' : 'text-blue-700 group-hover:underline'} flex items-center gap-1">
              <span>View Full Details &amp; Ideal PPT</span>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </span>
          </div>
        </div>
      `;
    });

    els.grid.innerHTML = html;

    // Attach click listeners to cards
    els.grid.querySelectorAll('.ps-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.dataset.psId;
        openDetailModal(id);
      });
    });
  }

  /* ---------- Detail Modal Handler ---------- */

  function openDetailModal(psId) {
    const ps = PROBLEM_STATEMENTS.find((p) => p.id === psId);
    if (!ps) return;

    els.modalPsId.textContent = ps.id;
    els.modalPsDomain.textContent = ps.domain;
    els.modalPsDomain.className = `px-2.5 py-0.5 rounded-full text-xs font-bold border ${DOMAIN_STYLES[ps.domain] || ''}`;
    
    els.modalPsType.textContent = `${TYPE_ICONS[ps.type] || ''} ${ps.type}`;
    els.modalPsDiff.textContent = ps.difficulty;
    els.modalPsDiff.className = `px-2 py-0.5 rounded-md text-xs font-bold border ${DIFFICULTY_STYLES[ps.difficulty] || ''}`;
    
    els.modalPsTitle.textContent = ps.title;
    els.modalPsDesc.textContent = ps.problemStatement;

    els.modalPsBeneficiaries.textContent = ps.beneficiaries || 'General public and stakeholders.';

    els.detailModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeDetailModal() {
    els.detailModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  /* ---------- Debounce Helper ---------- */
  function debounce(fn, wait = 120) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /* ---------- Event Listeners ---------- */

  function bindEvents() {
    // Search input debounced for fast desktop typing
    if (els.search) {
      els.search.addEventListener('input', debounce((e) => {
        state.search = e.target.value;
        renderGrid();
      }, 120));
    }

    // Type filter buttons
    if (els.typeGroup) {
      els.typeGroup.querySelectorAll('.type-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          els.typeGroup.querySelectorAll('.type-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          state.type = btn.dataset.type;
          renderGrid();
        });
      });
    }

    // Difficulty filter buttons
    if (els.difficultyGroup) {
      els.difficultyGroup.querySelectorAll('.diff-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          els.difficultyGroup.querySelectorAll('.diff-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          state.difficulty = btn.dataset.diff;
          renderGrid();
        });
      });
    }

    // Domain chips delegation
    if (els.domainChipsContainer) {
      els.domainChipsContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('.domain-chip');
        if (!chip) return;
        const domain = chip.dataset.domain;

        if (domain === 'ALL') {
          state.selectedDomains.clear();
        } else {
          if (state.selectedDomains.has(domain)) {
            state.selectedDomains.delete(domain);
          } else {
            state.selectedDomains.add(domain);
          }
        }
        renderDomainChips();
        renderGrid();
      });
    }

    // Delegation on PS Grid for Card clicks
    if (els.grid) {
      els.grid.addEventListener('click', (e) => {
        const card = e.target.closest('.ps-card');
        if (card && card.dataset.psId) {
          openDetailModal(card.dataset.psId);
        }
      });
    }

    // Sort filter buttons
    if (els.sortGroup) {
      els.sortGroup.querySelectorAll('.sort-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          els.sortGroup.querySelectorAll('.sort-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          state.sortBy = btn.dataset.sort;
          renderGrid();
        });
      });
    }

    // Reset filters
    const resetAll = () => {
      state.search = '';
      state.type = 'All';
      state.difficulty = 'All';
      state.selectedDomains.clear();
      state.sortBy = 'default';
      if (els.search) els.search.value = '';

      if (els.typeGroup) {
        els.typeGroup.querySelectorAll('.type-btn').forEach((b) => b.classList.toggle('active', b.dataset.type === 'All'));
      }
      if (els.difficultyGroup) {
        els.difficultyGroup.querySelectorAll('.diff-btn').forEach((b) => b.classList.toggle('active', b.dataset.diff === 'All'));
      }
      if (els.sortGroup) {
        els.sortGroup.querySelectorAll('.sort-btn').forEach((b) => b.classList.toggle('active', b.dataset.sort === 'default'));
      }

      renderDomainChips();
      renderGrid();
    };

    if (els.resetBtn) els.resetBtn.addEventListener('click', resetAll);
    if (els.clearEmptyBtn) els.clearEmptyBtn.addEventListener('click', resetAll);

    // Modal Close
    els.modalCloseBtn.addEventListener('click', closeDetailModal);
    els.detailModal.addEventListener('click', (e) => {
      if (e.target === els.detailModal) closeDetailModal();
    });
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
