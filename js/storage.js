/**
 * Lightweight Storage Utility & Automatic Legacy Draft Cleanup
 */
const Storage = (() => {
  const KEY_DRAFT = 'sih2026_registration_draft';
  const KEY_SUBMISSION = 'sih2026_registration_submission';

  // Automatically clear old heavy draft items from browser storage on load
  try {
    localStorage.removeItem(KEY_DRAFT);
    localStorage.removeItem(KEY_SUBMISSION);
    sessionStorage.removeItem(KEY_DRAFT);
  } catch {}

  function saveDraft() { return true; }
  function loadDraft() { return null; }
  function clearDraft() {
    try {
      localStorage.removeItem(KEY_DRAFT);
      sessionStorage.removeItem(KEY_DRAFT);
    } catch {}
  }

  function saveSubmission(data) {
    try {
      sessionStorage.setItem(KEY_SUBMISSION, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  function loadSubmission() {
    try {
      const raw = sessionStorage.getItem(KEY_SUBMISSION);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function clearSubmission() {
    try {
      sessionStorage.removeItem(KEY_SUBMISSION);
    } catch {}
  }

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    saveSubmission,
    loadSubmission,
    clearSubmission
  };
})();
