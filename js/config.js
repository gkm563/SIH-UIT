/**
 * Frontend configuration for SIH 2026 registration API.
 *
 * Replace GOOGLE_SCRIPT_URL with your deployed Apps Script Web App URL:
 * Deploy → Manage deployments → Web app → URL
 *
 * Example:
 * https://script.google.com/macros/s/AKfycbx.../exec
 */
const AppConfig = {
  /**
   * Google Apps Script Web App endpoint (doPost / doGet).
   * Leave empty to show a clear setup error on submit.
   */
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzq4KNMHY0WvdHSnY2P18iUL5GAFJBQudUgDMG6_nHw3HGpH8mAtvAXs_jDo3odosLX/exec',

  /** Request timeout in milliseconds */
  REQUEST_TIMEOUT_MS: 45000,

  /** App metadata */
  APP_NAME: 'SIH 2026 Internal Registration',

  /** Default Admin PIN */
  ADMIN_PIN: '8924059058',

  /** Registration Open/Closed Toggle */
  get isRegistrationOpen() {
    const val = localStorage.getItem('sih2026_registration_open');
    // Default is closed (false) since deadline 05 Aug 2026 has passed
    return val !== null ? val === 'true' : false;
  },

  setRegistrationOpen(status) {
    localStorage.setItem('sih2026_registration_open', String(status));
  },

  /** Problem Statement Bank Public Visibility Toggle */
  get isPSBankPublic() {
    const val = localStorage.getItem('sih2026_ps_public');
    return val !== null ? val === 'true' : false;
  },

  setPSBankPublic(status) {
    localStorage.setItem('sih2026_ps_public', String(status));
  }
};
