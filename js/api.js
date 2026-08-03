/**
 * Google Apps Script Web App client
 *
 * Notes on CORS with Apps Script:
 * - Sending Content-Type: application/json triggers a browser OPTIONS preflight.
 * - Apps Script Web Apps do not reliably answer OPTIONS.
 * - Use Content-Type: text/plain;charset=utf-8 with a JSON body instead.
 * - Deploy the Web App as: Execute as "Me", Who has access "Anyone".
 * - Valid success responses MUST include registrationId (SIH2026-XXXX).
 */
const Api = (() => {
  const REG_ID_RE = /^SIH2026-\d+$/i;

  function buildPayload(formData) {
    const fields = { ...(formData.fields || {}) };
    fields.declare_truth = !!fields.declare_truth;
    fields.declare_internal = !!fields.declare_internal;
    fields.declare_contact = !!fields.declare_contact;
    fields.teamSize = String(formData.teamSize || fields.teamSize || '');

    return {
      teamSize: parseInt(fields.teamSize, 10),
      teamName: fields.teamName || '',
      fields
    };
  }

  function isValidSuccess(data) {
    if (!data || data.success !== true) return false;
    if (typeof data.registrationId === 'string' && data.registrationId.trim().length > 0) {
      return true;
    }
    return false;
  }

  function parseResponseText(text) {
    if (!text || !String(text).trim()) {
      return {
        success: false,
        message: 'Empty response from server. Please try again.'
      };
    }

    const trimmed = String(text).trim();

    // 1. Try parsing JSON first (highest priority)
    try {
      const data = JSON.parse(trimmed);
      if (data && typeof data === 'object') {
        if (data.registrationId) {
          data.registrationId = String(data.registrationId).replace(/^'/, '').trim();
        }
        return data;
      }
    } catch {
      // Not JSON
    }

    // 2. Apps Script returns HTML login or permission error pages if Web App deployment access is restricted
    if (trimmed.startsWith('<!') || trimmed.toLowerCase().startsWith('<html')) {
      return {
        success: false,
        message:
          'Google returned an HTML page instead of JSON. Redeploy the Web App with access set to Anyone, then hard-refresh this site.'
      };
    }

    return {
      success: false,
      message: 'Unexpected server response. Please try again.'
    };
  }

  /**
   * Submit registration to Google Apps Script.
   * @param {object} formData - collectFormData() result
   * @returns {Promise<{success:boolean, registrationId?:string, timestamp?:string, message:string}>}
   */
  async function submitRegistration(formData) {
    const url = (AppConfig.GOOGLE_SCRIPT_URL || '').trim();
    if (!url) {
      return {
        success: false,
        message:
          'Google Sheets API is not configured. Add your Web App URL in js/config.js (GOOGLE_SCRIPT_URL).'
      };
    }

    if (window.location.protocol === 'file:') {
      return {
        success: false,
        message:
          'Open this site through a local server (not as a file). Example: python -m http.server 5500 then visit http://localhost:5500'
      };
    }

    const payload = buildPayload(formData);
    const body = JSON.stringify(payload.fields);
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller
      ? setTimeout(() => controller.abort(), AppConfig.REQUEST_TIMEOUT_MS || 45000)
      : null;

    try {
      // Primary: raw JSON as text/plain (works cleanly with Apps Script deploy, avoiding CORS preflight)
      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body,
        signal: controller ? controller.signal : undefined
      });

      const responseText = await response.text();
      let data = parseResponseText(responseText);

      // If the primary request succeeded or returned JSON with a registrationId, return it directly!
      if (data && (data.success === true || data.registrationId)) {
        return data;
      }

      // If server returned a business validation error (e.g. duplicate team name), return it without fallback
      if (data && data.success === false && data.message && !data.message.includes('Google returned an HTML')) {
        return data;
      }

      // Fallback ONLY if primary request suffered a network/CORS failure (data was NOT saved)
      try {
        const formBody = new URLSearchParams();
        formBody.append('data', body);
        const response2 = await fetch(url, {
          method: 'POST',
          mode: 'cors',
          redirect: 'follow',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
          },
          body: formBody.toString(),
          signal: controller ? controller.signal : undefined
        });
        const text2 = await response2.text();
        const data2 = parseResponseText(text2);
        if (data2 && (data2.success || data2.registrationId)) {
          return data2;
        }
      } catch {
        // Keep primary response error if fallback fails
      }

      return data;
    } catch (err) {
      if (err && err.name === 'AbortError') {
        return {
          success: false,
          message: 'Request timed out. Check your connection and try again.'
        };
      }
      return {
        success: false,
        message:
          'Could not reach Google Sheets. Check your internet connection and confirm the Web App URL.'
      };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /**
   * Connectivity check (GET) — also returns which spreadsheet is connected.
   */
  async function ping() {
    const url = (AppConfig.GOOGLE_SCRIPT_URL || '').trim();
    if (!url) return { success: false, message: 'API URL not configured.' };
    try {
      const res = await fetch(url, { method: 'GET', mode: 'cors', redirect: 'follow' });
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        return { success: false, message: 'Ping returned non-JSON response.' };
      }
    } catch {
      return { success: false, message: 'Ping failed.' };
    }
  }

  async function getRegisteredTeams() {
    const baseUrl = (AppConfig.GOOGLE_SCRIPT_URL || '').trim();
    if (!baseUrl) return { success: false, message: 'Google Script URL not configured.', teams: [] };

    const fetchUrl = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'action=teams';

    try {
      const response = await fetch(fetchUrl, {
        method: 'GET',
        mode: 'cors',
        redirect: 'follow'
      });
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        if (data && data.success && Array.isArray(data.teams)) {
          return data;
        }
        return { success: false, message: data.message || 'Invalid teams response format.', teams: [] };
      } catch {
        return { success: false, message: 'Non-JSON response received.', teams: [] };
      }
    } catch {
      return { success: false, message: 'Network error fetching registered teams.', teams: [] };
    }
  }

  return {
    submitRegistration,
    getRegisteredTeams,
    ping,
    buildPayload,
    isValidSuccess,
    REG_ID_RE
  };
})();
