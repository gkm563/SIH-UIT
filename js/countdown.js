/**
 * SIH 2026 Internal Hackathon - Live Countdown Timer Engine
 * Target: 22 August 2026, 09:00:00 AM IST
 */
(() => {
  'use strict';

  // Target Date: 22 August 2026, 09:00:00 IST
  const TARGET_DATE = new Date('2026-08-22T09:00:00+05:30').getTime();

  function updateCountdown() {
    const now = new Date().getTime();
    const diff = TARGET_DATE - now;

    const pad = (n) => String(Math.max(0, n)).padStart(2, '0');

    if (diff <= 0) {
      document.querySelectorAll('.cd-days-val, #cd-days').forEach(el => el.textContent = '00');
      document.querySelectorAll('.cd-hours-val, #cd-hours').forEach(el => el.textContent = '00');
      document.querySelectorAll('.cd-mins-val, #cd-mins').forEach(el => el.textContent = '00');
      document.querySelectorAll('.cd-secs-val, #cd-secs').forEach(el => el.textContent = '00');
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    document.querySelectorAll('.cd-days-val, #cd-days').forEach(el => el.textContent = pad(days));
    document.querySelectorAll('.cd-hours-val, #cd-hours').forEach(el => el.textContent = pad(hours));
    document.querySelectorAll('.cd-mins-val, #cd-mins').forEach(el => el.textContent = pad(mins));
    document.querySelectorAll('.cd-secs-val, #cd-secs').forEach(el => el.textContent = pad(secs));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      updateCountdown();
      setInterval(updateCountdown, 1000);
    });
  } else {
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }
})();
