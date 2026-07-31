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
    return (
      data &&
      data.success === true &&
      typeof data.registrationId === 'string' &&
      REG_ID_RE.test(data.registrationId.trim())
    );
  }

  function parseResponseText(text) {
    if (!text || !String(text).trim()) {
      return {
        success: false,
        message: 'Empty response from server. Redeploy the Apps Script Web App and try again.'
      };
    }

    const trimmed = String(text).trim();

    // Apps Script sometimes returns HTML login / error pages
    if (trimmed.startsWith('<!') || trimmed.toLowerCase().startsWith('<html')) {
      return {
        success: false,
        message:
          'Google returned an HTML page instead of JSON. Redeploy the Web App with access set to Anyone, then hard-refresh this site.'
      };
    }

    let data;
    try {
      data = JSON.parse(trimmed);
    } catch {
      return {
        success: false,
        message:
          'Unexpected server response. Confirm the Web App is deployed (Anyone) and you pasted the /exec URL in js/config.js.'
      };
    }

    // Health-check GET mistaken for submit (no registrationId)
    if (data.success === true && !data.registrationId) {
      return {
        success: false,
        message:
          'Server responded without a Registration ID. The submission was not saved. Please try again, or redeploy Apps Script.'
      };
    }

    if (data.success === true && !isValidSuccess(data)) {
      return {
        success: false,
        message: 'Invalid Registration ID returned by server. Submission may not have been saved.'
      };
    }

    return data;
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
      // Primary: raw JSON as text/plain (works with current Apps Script deploy, no CORS preflight)
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

      let data = parseResponseText(await response.text());

      // Fallback: form field "data" (for newer Code.gs that reads e.parameter.data)
      if (!isValidSuccess(data)) {
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
        data = parseResponseText(await response2.text());
      }

      if (!data.success) return data;
      if (!isValidSuccess(data)) {
        return {
          success: false,
          message: 'Submission failed: no valid Registration ID received from Google Sheets.'
        };
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
          'Could not reach Google Sheets. Use http://localhost (not file://), check your internet, and confirm the Web App URL.'
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
