/**
 * Draft auto-save using localStorage
 */
const Storage = (() => {
  const KEY_DRAFT = 'sih2026_registration_draft';
  const KEY_SUBMISSION = 'sih2026_registration_submission';

  function saveDraft(data) {
    try {
      const payload = {
        ...data,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(KEY_DRAFT, JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(KEY_DRAFT);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function clearDraft() {
    localStorage.removeItem(KEY_DRAFT);
  }

  function saveSubmission(data) {
    try {
      localStorage.setItem(KEY_SUBMISSION, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  function loadSubmission() {
    try {
      const raw = localStorage.getItem(KEY_SUBMISSION);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function clearSubmission() {
    localStorage.removeItem(KEY_SUBMISSION);
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
