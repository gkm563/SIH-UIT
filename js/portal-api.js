/**
 * SIH 2026 Portal API — Login, PS Selection, Password Management
 */
const PortalApi = (() => {
  'use strict';

  const BASE_URL = typeof AppConfig !== 'undefined'
    ? AppConfig.GOOGLE_SCRIPT_URL
    : 'https://script.google.com/macros/s/AKfycbzq4KNMHY0WvdHSnY2P18iUL5GAFJBQudUgDMG6_nHw3HGpH8mAtvAXs_jDo3odosLX/exec';

  async function get(params) {
    const query = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const fullUrl = BASE_URL + (BASE_URL.includes('?') ? '&' : '?') + query;
    const res = await fetch(fullUrl, { method: 'GET' });
    if (!res.ok) throw new Error('Network error: ' + res.status);
    return res.json();
  }

  return {
    login: (regId, password) =>
      get({ action: 'login', regId, password }),

    selectPS: (regId, password, psId, psTitle) =>
      get({ action: 'selectps', regId, password, psId, psTitle }),

    forgotOTP: (regId) =>
      get({ action: 'forgototp', regId }),

    resetPassword: (regId, otp, newPassword) =>
      get({ action: 'resetpwd', regId, otp, newPassword }),

    changePassword: (regId, oldPassword, newPassword) =>
      get({ action: 'changepwd', regId, oldPassword, newPassword }),

    getPSCounts: () =>
      get({ action: 'pscounts' }),

    generatePasswords: (adminKey) =>
      get({ action: 'genpasswords', adminKey })
  };
})();
