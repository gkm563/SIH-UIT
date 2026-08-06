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
    'Robotics': 'bg-stone-100 text-stone-900 border-stone-300'
  };

  const DIFFICULTY_STYLES = {
    'Beginner': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Intermediate': 'bg-amber-50 text-amber-800 border-amber-200',
    'Advanced': 'bg-purple-50 text-purple-700 border-purple-200'
  };

  const TYPE_ICONS = {
    'Software': '🖥️',
    'Hardware': '⚙️',
    'Hybrid': '🔀'
  };

  // State
  const state = {
    search: '',
    type: 'All',
    difficulty: 'All',
    selectedDomains: new Set()
  };

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
    
    // Detail Modal
    detailModal: document.getElementById('ps-detail-modal'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalPsId: document.getElementById('modal-ps-id'),
    modalPsDomain: document.getElementById('modal-ps-domain'),
    modalPsType: document.getElementById('modal-ps-type'),
    modalPsDiff: document.getElementById('modal-ps-diff'),
    modalPsTitle: document.getElementById('modal-ps-title'),
    modalPsDesc: document.getElementById('modal-ps-desc'),
    modalPsSolution: document.getElementById('modal-ps-solution'),
    modalPsTech: document.getElementById('modal-ps-tech'),
    modalPsBeneficiaries: document.getElementById('modal-ps-beneficiaries')
  };

  /* ---------- Initialization ---------- */

  function init() {
    renderDomainChips();
    bindEvents();
    renderGrid();
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

    return PROBLEM_STATEMENTS.filter((ps) => {
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
      if (state.type !== 'All' && ps.type !== state.type) return false;

      // Difficulty
      if (state.difficulty !== 'All' && ps.difficulty !== state.difficulty) return false;

      // Domain
      if (state.selectedDomains.size > 0 && !state.selectedDomains.has(ps.domain)) return false;

      return true;
    });
  }

  function renderGrid() {
    const filtered = filterStatements();

    // Results Counter Badge
    if (els.resultsCount) {
      els.resultsCount.textContent = `Showing ${filtered.length} of ${PROBLEM_STATEMENTS.length} Problem Statements`;
    }

    // Toggle Reset Filter Button Visibility
    const isFiltered =
      state.search !== '' || state.type !== 'All' || state.difficulty !== 'All' || state.selectedDomains.size > 0;
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

      html += `
        <div class="ps-card bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group hover:-translate-y-1" data-ps-id="${ps.id}">
          <div>
            <!-- Top Meta Row -->
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full font-mono">
                ${ps.id}
              </span>
              <div class="flex items-center gap-1.5 flex-wrap justify-end">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${domainStyle}">${escapeHtml(ps.domain)}</span>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80">${icon} ${ps.type}</span>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${diffStyle}">${ps.difficulty}</span>
              </div>
            </div>

            <!-- Title -->
            <h3 class="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug mb-2">
              ${escapeHtml(ps.title)}
            </h3>

            <!-- Summary -->
            <p class="text-xs text-slate-600 leading-relaxed font-normal mb-4">
              ${escapeHtml(summary)}
            </p>
          </div>

          <!-- Bottom Action Bar -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <span class="text-[11px] font-extrabold text-blue-700 group-hover:underline flex items-center gap-1">
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

    // Solution Checklist
    els.modalPsSolution.innerHTML = (ps.expectedSolution || []).map((sol) => `
      <li class="flex items-start gap-2 bg-emerald-50/60 border border-emerald-100 p-2.5 rounded-xl">
        <svg class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        <span class="text-xs font-semibold text-slate-800 leading-snug">${escapeHtml(sol)}</span>
      </li>
    `).join('');

    // Tech Stack Chips
    els.modalPsTech.innerHTML = (ps.techStack || []).map((tech) => `
      <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
        ${escapeHtml(tech)}
      </span>
    `).join('');

    els.modalPsBeneficiaries.textContent = ps.beneficiaries || 'General public and stakeholders.';

    els.detailModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeDetailModal() {
    els.detailModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  /* ---------- Event Listeners ---------- */

  function bindEvents() {
    // Search input
    els.search.addEventListener('input', (e) => {
      state.search = e.target.value;
      renderGrid();
    });

    // Type filter buttons
    els.typeGroup.querySelectorAll('.type-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        els.typeGroup.querySelectorAll('.type-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.type = btn.dataset.type;
        renderGrid();
      });
    });

    // Difficulty filter buttons
    els.difficultyGroup.querySelectorAll('.diff-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        els.difficultyGroup.querySelectorAll('.diff-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.difficulty = btn.dataset.diff;
        renderGrid();
      });
    });

    // Domain chips delegation
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

    // Reset filters
    const resetAll = () => {
      state.search = '';
      state.type = 'All';
      state.difficulty = 'All';
      state.selectedDomains.clear();
      els.search.value = '';

      els.typeGroup.querySelectorAll('.type-btn').forEach((b) => b.classList.toggle('active', b.dataset.type === 'All'));
      els.difficultyGroup.querySelectorAll('.diff-btn').forEach((b) => b.classList.toggle('active', b.dataset.diff === 'All'));

      renderDomainChips();
      renderGrid();
    };

    els.resetBtn.addEventListener('click', resetAll);
    els.clearEmptyBtn.addEventListener('click', resetAll);

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
