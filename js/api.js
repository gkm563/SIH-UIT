/**
 * Google Apps Script Web App client
 *
 * Notes on CORS with Apps Script:
 * - Sending Content-Type: application/json triggers a browser OPTIONS preflight.
 * - Apps Script Web Apps do not reliably answer OPTIONS.
 * - Use Content-Type: text/plain;charset=utf-8 with a JSON body instead.
 * - Deploy the Web App as: Execute as "Me", Who has access "Anyone".
 */
const Api = (() => {
  function buildPayload(formData) {
    const fields = { ...(formData.fields || {}) };
    // Ensure booleans for declarations
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

    const payload = buildPayload(formData);
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller
      ? setTimeout(() => controller.abort(), AppConfig.REQUEST_TIMEOUT_MS || 45000)
      : null;

    try {
      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        headers: {
          // text/plain avoids CORS preflight with Apps Script
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload.fields),
        signal: controller ? controller.signal : undefined
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return {
          success: false,
          message:
            'Unexpected server response. Confirm the Web App is deployed and accessible to Anyone.'
        };
      }

      if (!data || typeof data.success !== 'boolean') {
        return {
          success: false,
          message: 'Invalid API response format.'
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
          'Could not reach the registration server. Check your internet connection and Web App URL.'
      };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /**
   * Optional connectivity check (GET).
   */
  async function ping() {
    const url = (AppConfig.GOOGLE_SCRIPT_URL || '').trim();
    if (!url) return { success: false, message: 'API URL not configured.' };
    try {
      const res = await fetch(url, { method: 'GET', mode: 'cors', redirect: 'follow' });
      return await res.json();
    } catch {
      return { success: false, message: 'Ping failed.' };
    }
  }

  return {
    submitRegistration,
    ping,
    buildPayload
  };
})();
