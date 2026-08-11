/**
 * SIH 2026 Portal Auth — Session Management
 * Session stored in sessionStorage: cleared on tab/browser close
 */
const PortalAuth = (() => {
  'use strict';
  const KEY = 'sih26_portal_session';

  function save(team, password) {
    sessionStorage.setItem(KEY, JSON.stringify({
      regId: team.registrationId,
      teamName: team.teamName,
      password, // used for subsequent API calls
      team,
      loginAt: Date.now()
    }));
  }

  function get() {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function clear() {
    sessionStorage.removeItem(KEY);
  }

  function updateTeam(team) {
    const s = get();
    if (s) save(team, s.password);
  }

  // Redirect to login if not logged in (call on protected pages)
  function requireAuth() {
    const s = get();
    if (!s) {
      window.location.href = 'portal.html';
      return null;
    }
    return s;
  }

  return { save, get, clear, updateTeam, requireAuth };
})();
