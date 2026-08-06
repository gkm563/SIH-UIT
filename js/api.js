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

      // If primary request returned a business validation error (e.g. duplicate team name / roll), return it directly
      if (data && data.success === false && data.message && !data.message.includes('Google returned an HTML') && !data.message.includes('online')) {
        return data;
      }

      // Fallback 1: urlencoded POST
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
        if (data2 && (data2.success === true || data2.registrationId)) {
          return data2;
        }
      } catch {
        // ignore
      }

      // Fallback 2: GET submission (handles browser 302 redirect conversion cleanly)
      try {
        const getUrl = url + (url.includes('?') ? '&' : '?') + 'action=submit&data=' + encodeURIComponent(body);
        const response3 = await fetch(getUrl, {
          method: 'GET',
          mode: 'cors',
          redirect: 'follow',
          signal: controller ? controller.signal : undefined
        });
        const text3 = await response3.text();
        const data3 = parseResponseText(text3);
        if (data3 && (data3.success === true || data3.registrationId)) {
          return data3;
        }
        if (data3 && data3.success === false && data3.message) {
          return data3;
        }
      } catch {
        // ignore
      }

      return data || { success: false, message: 'Submission failed. Please try again.' };
    } catch (err) {
      if (err && err.name === 'AbortError') {
        return {
          success: false,
          message: 'Request timed out. Check your connection and try again.'
        };
      }

      // Emergency Fallback: GET submission on CORS exception
      try {
        const getUrl = url + (url.includes('?') ? '&' : '?') + 'action=submit&data=' + encodeURIComponent(body);
        const response3 = await fetch(getUrl, {
          method: 'GET',
          mode: 'cors',
          redirect: 'follow'
        });
        const text3 = await response3.text();
        const data3 = parseResponseText(text3);
        if (data3 && (data3.success === true || data3.registrationId)) {
          return data3;
        }
        if (data3 && data3.success === false && data3.message) {
          return data3;
        }
      } catch {
        // ignore
      }

      return {
        success: false,
        message:
          'Could not reach Google Sheets. Check your internet connection and confirm the Web App URL is deployed.'
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

  const TEAMS_CACHE_KEY = 'sih2026_registered_teams_cache';

  const FALLBACK_LIVE_TEAMS = [
    {"registrationId":"SIH2026-0019","teamName":"HealTech","timestamp":"Wed Jul 29 2026 15:42:36 GMT+0530"},
    {"registrationId":"SIH2026-0021","teamName":"Mavcriks","timestamp":"Wed Jul 29 2026 18:46:52 GMT+0530"},
    {"registrationId":"SIH2026-0027","teamName":"Team Prayas","timestamp":"Wed Jul 29 2026 22:44:05 GMT+0530"},
    {"registrationId":"SIH2026-0028","teamName":"AASIA-Z","timestamp":"Wed Jul 29 2026 23:10:29 GMT+0530"},
    {"registrationId":"SIH2026-0029","teamName":"IntelliSix","timestamp":"Wed Jul 29 2026 23:26:35 GMT+0530"},
    {"registrationId":"SIH2026-0030","teamName":"cookieking","timestamp":"Wed Jul 29 2026 23:44:02 GMT+0530"},
    {"registrationId":"SIH2026-0031","teamName":"EVOLVEX","timestamp":"Thu Jul 30 2026 09:27:01 GMT+0530"},
    {"registrationId":"SIH2026-0032","teamName":"Mind Matrix","timestamp":"Thu Jul 30 2026 12:37:54 GMT+0530"},
    {"registrationId":"SIH2026-0033","teamName":"PranaCoders","timestamp":"Thu Jul 30 2026 13:06:03 GMT+0530"},
    {"registrationId":"SIH2026-0034","teamName":"COSINE7","timestamp":"Thu Jul 30 2026 15:35:13 GMT+0530"},
    {"registrationId":"SIH2026-0035","teamName":"Syntax Squad","timestamp":"Thu Jul 30 2026 16:51:00 GMT+0530"},
    {"registrationId":"SIH2026-0036","teamName":"CodeNova","timestamp":"Thu Jul 30 2026 17:03:15 GMT+0530"},
    {"registrationId":"SIH2026-0037","teamName":"Root Slayers","timestamp":"Thu Jul 30 2026 18:17:30 GMT+0530"},
    {"registrationId":"SIH2026-0038","teamName":"Bug Strikers","timestamp":"Thu Jul 30 2026 19:07:16 GMT+0530"},
    {"registrationId":"SIH2026-0039","teamName":"Code Crafters","timestamp":"Thu Jul 30 2026 19:46:13 GMT+0530"},
    {"registrationId":"SIH2026-0040","teamName":"Hakuna matata","timestamp":"Thu Jul 30 2026 20:00:16 GMT+0530"},
    {"registrationId":"SIH2026-0041","teamName":"Hakuna matata","timestamp":"Thu Jul 30 2026 20:13:06 GMT+0530"},
    {"registrationId":"SIH2026-0042","teamName":"Restitutor Orbis","timestamp":"Thu Jul 30 2026 21:38:02 GMT+0530"},
    {"registrationId":"SIH2026-0043","teamName":"LinkedList","timestamp":"Thu Jul 30 2026 22:08:52 GMT+0530"},
    {"registrationId":"SIH2026-0044","teamName":"Cryptic Coders","timestamp":"Thu Jul 30 2026 22:10:57 GMT+0530"},
    {"registrationId":"SIH2026-0045","teamName":"Blue Nova","timestamp":"Thu Jul 30 2026 22:29:10 GMT+0530"},
    {"registrationId":"SIH2026-0046","teamName":"ByteForge","timestamp":"Fri Jul 31 2026 12:59:06 GMT+0530"},
    {"registrationId":"SIH2026-0047","teamName":"Viper Syndicate","timestamp":"Fri Jul 31 2026 13:10:00 GMT+0530"},
    {"registrationId":"SIH2026-0048","teamName":"The Phoenix 🐦‍🔥","timestamp":"Fri Jul 31 2026 13:13:14 GMT+0530"},
    {"registrationId":"SIH2026-0051","teamName":"Bug Slayers","timestamp":"Fri Jul 31 2026 16:39:23 GMT+0530"},
    {"registrationId":"SIH2026-0052","teamName":"Vector","timestamp":"Fri Jul 31 2026 16:58:28 GMT+0530"},
    {"registrationId":"SIH2026-0053","teamName":"NovaTech Coders","timestamp":"Fri Jul 31 2026 18:18:42 GMT+0530"},
    {"registrationId":"SIH2026-0054","teamName":"RIZEN CODERS","timestamp":"Fri Jul 31 2026 20:37:26 GMT+0530"},
    {"registrationId":"SIH2026-0055","teamName":"Sankalp Tech","timestamp":"Fri Jul 31 2026 21:26:31 GMT+0530"},
    {"registrationId":"SIH2026-0056","teamName":"Code Warriors","timestamp":"Fri Jul 31 2026 21:42:40 GMT+0530"},
    {"registrationId":"SIH2026-0057","teamName":"CodeRushers","timestamp":"Fri Jul 31 2026 21:43:57 GMT+0530"},
    {"registrationId":"SIH2026-0058","teamName":"Cipher Nova","timestamp":"Fri Jul 31 2026 22:40:48 GMT+0530"},
    {"registrationId":"SIH2026-0060","teamName":"Wero","timestamp":"Fri Jul 31 2026 23:39:15 GMT+0530"},
    {"registrationId":"SIH2026-0061","teamName":"Coder ninja","timestamp":"Sat Aug 01 2026 00:03:46 GMT+0530"},
    {"registrationId":"SIH2026-0063","teamName":"Code Alchemists","timestamp":"Sat Aug 01 2026 12:19:18 GMT+0530"},
    {"registrationId":"SIH2026-0064","teamName":"The Catalysts","timestamp":"Sat Aug 01 2026 15:21:48 GMT+0530"},
    {"registrationId":"SIH2026-0065","teamName":"Rising Coders","timestamp":"Sat Aug 01 2026 22:07:58 GMT+0530"},
    {"registrationId":"SIH2026-0066","teamName":"Celestial 🔥","timestamp":"Mon Aug 03 2026 09:34:36 GMT+0530"},
    {"registrationId":"SIH2026-0067","teamName":"Lumos cipher","timestamp":"Mon Aug 03 2026 21:07:02 GMT+0530"},
    {"registrationId":"SIH2026-0068","teamName":"Tech Geeks","timestamp":"Tue Aug 04 2026 10:12:49 GMT+0530"},
    {"registrationId":"SIH2026-0069","teamName":"The Change Catalysts","timestamp":"Tue Aug 04 2026 12:11:00 GMT+0530"},
    {"registrationId":"SIH2026-0071","teamName":"Obsidian Tech","timestamp":"Tue Aug 04 2026 13:07:06 GMT+0530"},
    {"registrationId":"SIH2026-0072","teamName":"Track Shield","timestamp":"Tue Aug 04 2026 13:10:12 GMT+0530"},
    {"registrationId":"SIH2026-0073","teamName":"LogicX","timestamp":"Tue Aug 04 2026 18:43:20 GMT+0530"},
    {"registrationId":"SIH2026-0074","teamName":"BruteForce","timestamp":"Tue Aug 04 2026 19:54:58 GMT+0530"},
    {"registrationId":"SIH2026-0075","teamName":"Apex Developers","timestamp":"Tue Aug 04 2026 20:56:37 GMT+0530"},
    {"registrationId":"SIH2026-0091","teamName":"VisionX","timestamp":"Tue Aug 04 2026 21:52:38 GMT+0530"},
    {"registrationId":"SIH2026-0100","teamName":"CODE TITANS","timestamp":"Tue Aug 04 2026 21:55:48 GMT+0530"},
    {"registrationId":"SIH2026-0122","teamName":"Panthers","timestamp":"Tue Aug 04 2026 22:25:26 GMT+0530"},
    {"registrationId":"SIH2026-0123","teamName":"Super Six","timestamp":"Tue Aug 04 2026 22:32:04 GMT+0530"},
    {"registrationId":"SIH2026-0125","teamName":"Health Horizons","timestamp":"Tue Aug 04 2026 22:42:40 GMT+0530"},
    {"registrationId":"SIH2026-0126","teamName":"Syntax Avengers","timestamp":"Tue Aug 04 2026 22:49:09 GMT+0530"},
    {"registrationId":"SIH2026-0127","teamName":"Code Avengers","timestamp":"Tue Aug 04 2026 22:52:54 GMT+0530"},
    {"registrationId":"SIH2026-0128","teamName":"Viksit4","timestamp":"Tue Aug 04 2026 22:57:31 GMT+0530"},
    {"registrationId":"SIH2026-0129","teamName":"Lunar_Spark","timestamp":"Tue Aug 04 2026 23:45:12 GMT+0530"},
    {"registrationId":"SIH2026-0130","teamName":"FerrumLogica","timestamp":"Wed Aug 05 2026 10:19:28 GMT+0530"},
    {"registrationId":"SIH2026-0131","teamName":"Shield core","timestamp":"Wed Aug 05 2026 13:15:43 GMT+0530"},
    {"registrationId":"SIH2026-0132","teamName":"Paperx","timestamp":"Wed Aug 05 2026 19:37:40 GMT+0530"},
    {"registrationId":"SIH2026-0133","teamName":"Syntaxsphere","timestamp":"Wed Aug 05 2026 20:36:07 GMT+0530"},
    {"registrationId":"SIH2026-0134","teamName":"Astro","timestamp":"Wed Aug 05 2026 20:51:39 GMT+0530"},
    {"registrationId":"SIH2026-0135","teamName":"Warrior","timestamp":"Wed Aug 05 2026 21:33:14 GMT+0530"},
    {"registrationId":"SIH2026-0136","teamName":"The_Bytewright's","timestamp":"Wed Aug 05 2026 22:00:36 GMT+0530"},
    {"registrationId":"SIH2026-0137","teamName":"ZSquad","timestamp":"Wed Aug 05 2026 22:08:18 GMT+0530"},
    {"registrationId":"SIH2026-0138","teamName":"SS Tech","timestamp":"Wed Aug 05 2026 22:10:37 GMT+0530"},
    {"registrationId":"SIH2026-0139","teamName":"FusionX","timestamp":"Wed Aug 05 2026 22:36:29 GMT+0530"},
    {"registrationId":"SIH2026-0140","teamName":"Alpha Innovators","timestamp":"Wed Aug 05 2026 22:41:56 GMT+0530"},
    {"registrationId":"SIH2026-0141","teamName":"Apex Innovators","timestamp":"Wed Aug 05 2026 22:46:57 GMT+0530"},
    {"registrationId":"SIH2026-0142","teamName":"Bits n Bytes","timestamp":"Wed Aug 05 2026 23:13:44 GMT+0530"},
    {"registrationId":"SIH2026-0143","teamName":"MLXPERTS","timestamp":"Wed Aug 05 2026 23:25:58 GMT+0530"},
    {"registrationId":"SIH2026-0144","teamName":"The Sparkers","timestamp":"Wed Aug 05 2026 23:27:19 GMT+0530"}
  ];

  function getLocalCachedTeams() {
    try {
      const raw = localStorage.getItem(TEAMS_CACHE_KEY) || sessionStorage.getItem(TEAMS_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.success && Array.isArray(parsed.teams) && parsed.teams.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return { success: true, teams: FALLBACK_LIVE_TEAMS, isFallback: true };
  }

  function setLocalCachedTeams(data) {
    try {
      const str = JSON.stringify(data);
      localStorage.setItem(TEAMS_CACHE_KEY, str);
      sessionStorage.setItem(TEAMS_CACHE_KEY, str);
    } catch {
      // ignore
    }
  }

  async function getRegisteredTeams(forceFresh = false) {
    const baseUrl = (AppConfig.GOOGLE_SCRIPT_URL || '').trim();
    const cached = getLocalCachedTeams();

    if (!baseUrl) {
      return cached;
    }

    const fetchUrl = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'action=teams&_t=' + Date.now();

    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeout = setTimeout(() => controller && controller.abort(), 12000); // 12s fast timeout

      const response = await fetch(fetchUrl, {
        method: 'GET',
        mode: 'cors',
        redirect: 'follow',
        signal: controller ? controller.signal : undefined
      });
      if (timeout) clearTimeout(timeout);

      const text = await response.text();

      try {
        const data = JSON.parse(text);
        if (data && data.success && Array.isArray(data.teams) && data.teams.length > 0) {
          setLocalCachedTeams(data);
          return data;
        }
      } catch {
        // Response was non-JSON
      }

      return cached;
    } catch (err) {
      return cached;
    }
  }

  return {
    submitRegistration,
    getRegisteredTeams,
    getLocalCachedTeams,
    setLocalCachedTeams,
    ping,
    buildPayload,
    isValidSuccess,
    REG_ID_RE
  };
})();
