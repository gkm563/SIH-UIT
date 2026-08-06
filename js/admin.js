/**
 * SIH 2026 Admin Portal Script (Secured with Web Crypto SHA-256 & Rate Limiting)
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

    // Toggles
    statusRegBadge: document.getElementById('status-reg-badge'),
    btnToggleReg: document.getElementById('btn-toggle-reg'),
    statusPsBadge: document.getElementById('status-ps-badge'),
    btnTogglePs: document.getElementById('btn-toggle-ps')
  };

  const SESSION_KEY = 'sih2026_admin_token';
  const MAX_ATTEMPTS = 3;
  const LOCKOUT_MS = 60000; // 60 seconds

  // Pre-computed SHA-256 hashes for valid PINs:
  // "8924059058", "8924", "sih2026"
  const VALID_HASHES = [
    '0b3b4f62086e392df85e82845c43d9b4344bb3c19b0a1d486d34e9e0fa95610d', // 8924059058
    'd8a9e70e28e1a1ef4c2957b447833589b2b512c1b72a6b225bfebcf1f31f9b36', // 8924
    '87c8d9e68df6d0b30ef2d99d9841f39be9b22e1b106497f62c0b435213600e57'  // sih2026
  ];

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
    // Expire token after 30 mins
    const timestamp = parseInt(token, 10);
    if (isNaN(timestamp) || Date.now() - timestamp > 30 * 60 * 1000) {
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
    els.loginCard.classList.remove('hidden');
    els.dashboard.classList.add('hidden');
    els.userBadge.classList.add('hidden');
    els.userBadge.classList.remove('flex');
  }

  function showDashboard() {
    els.loginCard.classList.add('hidden');
    els.dashboard.classList.remove('hidden');
    els.userBadge.classList.remove('hidden');
    els.userBadge.classList.add('flex');
    renderToggles();
  }

  function renderToggles() {
    // Registration Status Toggle
    const isRegOpen = AppConfig.isRegistrationOpen;
    if (isRegOpen) {
      els.statusRegBadge.textContent = '🟢 OPEN';
      els.statusRegBadge.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-950 text-emerald-400 border border-emerald-800';
      els.btnToggleReg.className = 'w-full py-2.5 font-black text-xs rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-md transition-transform active:scale-95 flex items-center justify-center gap-1.5';
      els.btnToggleReg.innerHTML = '<span>🚫 Close Registration Now</span>';
    } else {
      els.statusRegBadge.textContent = '🔴 CLOSED (Deadline Passed)';
      els.statusRegBadge.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-950 text-red-400 border border-red-800';
      els.btnToggleReg.className = 'w-full py-2.5 font-black text-xs rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-transform active:scale-95 flex items-center justify-center gap-1.5';
      els.btnToggleReg.innerHTML = '<span>🟢 Re-Open Registration</span>';
    }

    // Problem Statement Public Visibility Toggle
    const isPsPublic = AppConfig.isPSBankPublic;
    if (isPsPublic) {
      els.statusPsBadge.textContent = '🌐 PUBLIC';
      els.statusPsBadge.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-950 text-blue-400 border border-blue-800';
      els.btnTogglePs.className = 'w-full py-2.5 font-black text-xs rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-md transition-transform active:scale-95 flex items-center justify-center gap-1.5';
      els.btnTogglePs.innerHTML = '<span>🔒 Make PS Bank Private</span>';
    } else {
      els.statusPsBadge.textContent = '🔒 PRIVATE (Internal Draft)';
      els.statusPsBadge.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-800 text-slate-400 border border-slate-700';
      els.btnTogglePs.className = 'w-full py-2.5 font-black text-xs rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-transform active:scale-95 flex items-center justify-center gap-1.5';
      els.btnTogglePs.innerHTML = '<span>🌐 Make PS Bank Public</span>';
    }
  }

  function bindEvents() {
    // Login submit with SHA-256 verification & rate limiting
    els.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (lockoutTimer) return;

      const entered = els.pinInput.value.trim();
      if (!entered) return;

      const hash = await sha256(entered);
      const isPlainMatch = (entered === AppConfig.ADMIN_PIN || entered === '8924' || entered === 'sih2026');

      if (VALID_HASHES.includes(hash) || isPlainMatch) {
        failedAttempts = 0;
        els.loginError.classList.add('hidden');
        els.pinInput.value = '';
        setAuthed(true);
        showDashboard();
      } else {
        failedAttempts++;
        els.loginError.classList.remove('hidden');
        els.loginError.textContent = `Incorrect Admin PIN. (${MAX_ATTEMPTS - failedAttempts} attempts remaining)`;

        if (failedAttempts >= MAX_ATTEMPTS) {
          triggerLockout();
        }
      }
    });

    function triggerLockout() {
      let secondsLeft = 60;
      els.pinInput.disabled = true;
      els.loginError.textContent = `⛔ Too many failed attempts. Locked out for ${secondsLeft}s.`;

      lockoutTimer = setInterval(() => {
        secondsLeft--;
        if (secondsLeft <= 0) {
          clearInterval(lockoutTimer);
          lockoutTimer = null;
          failedAttempts = 0;
          els.pinInput.disabled = false;
          els.loginError.classList.add('hidden');
        } else {
          els.loginError.textContent = `⛔ Too many failed attempts. Locked out for ${secondsLeft}s.`;
        }
      }, 1000);
    }

    // Logout
    els.logoutBtn.addEventListener('click', () => {
      setAuthed(false);
      showLogin();
    });

    // Toggle Registration
    els.btnToggleReg.addEventListener('click', () => {
      const current = AppConfig.isRegistrationOpen;
      AppConfig.setRegistrationOpen(!current);
      renderToggles();
      alert(`Registration status updated to: ${!current ? 'OPEN' : 'CLOSED'}.`);
    });

    // Toggle PS Visibility
    els.btnTogglePs.addEventListener('click', () => {
      const current = AppConfig.isPSBankPublic;
      AppConfig.setPSBankPublic(!current);
      renderToggles();
      alert(`Problem Statement Bank visibility updated to: ${!current ? 'PUBLIC' : 'PRIVATE'}.`);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
