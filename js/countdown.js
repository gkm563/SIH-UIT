/**
 * SIH 2026 Internal Hackathon — Smart Phase-Aware Countdown Engine
 *
 * Phase 1 (PRE):  Before 22 Aug 2026, 9:00 AM IST  → Live countdown
 * Phase 2 (LIVE): 22 Aug 2026, 9:00 AM – 5:00 PM IST → "Presentation Started!"
 * Phase 3 (DONE): After 22 Aug 2026, 5:00 PM IST    → "Done! Top 50 list coming soon"
 */
(() => {
  'use strict';

  const START = new Date('2026-08-22T09:00:00+05:30').getTime(); // 9:00 AM IST
  const END   = new Date('2026-08-22T17:00:00+05:30').getTime(); // 5:00 PM IST

  const pad = (n) => String(Math.max(0, n)).padStart(2, '0');

  let currentPhase = null; // track to avoid redundant DOM updates

  function setPhase(phase) {
    if (currentPhase === phase) return; // no change
    currentPhase = phase;

    const pre  = document.getElementById('phase-pre');
    const live = document.getElementById('phase-live');
    const done = document.getElementById('phase-done');

    if (!pre && !live && !done) return; // not on index page

    // Show/hide phase blocks
    if (pre)  pre.classList.toggle('hidden',  phase !== 'pre');
    if (live) live.classList.toggle('hidden', phase !== 'live');
    if (done) done.classList.toggle('hidden', phase !== 'done');

    // Update countdown card border color for live/done phases
    const card = document.getElementById('countdown-card');
    if (card) {
      card.classList.remove('border-indigo-500/40', 'border-red-500/60', 'border-emerald-500/60');
      if (phase === 'live') card.classList.add('border-red-500/60');
      else if (phase === 'done') card.classList.add('border-emerald-500/60');
      else card.classList.add('border-indigo-500/40');
    }
  }

  function tick() {
    const now = Date.now();

    if (now < START) {
      // ── PHASE 1: Countdown ──
      setPhase('pre');
      const diff = START - now;
      const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs  = Math.floor((diff % (1000 * 60)) / 1000);

      document.querySelectorAll('#cd-days, .cd-days-val').forEach(el => el.textContent = pad(days));
      document.querySelectorAll('#cd-hours, .cd-hours-val').forEach(el => el.textContent = pad(hours));
      document.querySelectorAll('#cd-mins, .cd-mins-val').forEach(el => el.textContent = pad(mins));
      document.querySelectorAll('#cd-secs, .cd-secs-val').forEach(el => el.textContent = pad(secs));

      // Also update inline countdown on problems.html / other pages
      updateInlineBadge(days, hours, mins, secs);

    } else if (now >= START && now < END) {
      // ── PHASE 2: Live ──
      setPhase('live');
      updateInlineBadge(0, 0, 0, 0, 'live');

    } else {
      // ── PHASE 3: Done ──
      setPhase('done');
      updateInlineBadge(0, 0, 0, 0, 'done');
    }
  }

  // Update simple inline countdown badges used on problems.html & other pages
  function updateInlineBadge(days, hours, mins, secs, phase) {
    // problems.html countdown pill spans
    const dEl = document.getElementById('cd-days');
    const hEl = document.getElementById('cd-hours');
    const mEl = document.getElementById('cd-mins');
    const sEl = document.getElementById('cd-secs');

    if (phase === 'live') {
      if (dEl) dEl.textContent = '🔴';
      if (hEl) hEl.textContent = 'LIV';
      if (mEl) mEl.textContent = 'E!';
      if (sEl) sEl.textContent = '🎯';
      // Update surrounding label if exists
      const label = document.getElementById('cd-starts-label');
      if (label) label.textContent = 'Happening Now';
    } else if (phase === 'done') {
      if (dEl) dEl.textContent = '✅';
      if (hEl) hEl.textContent = 'DON';
      if (mEl) mEl.textContent = 'E!';
      if (sEl) sEl.textContent = '🏆';
      const label = document.getElementById('cd-starts-label');
      if (label) label.textContent = 'Completed';
    }
    // If phase undefined = pre, normal tick already sets values above
  }

  function init() {
    tick();
    setInterval(tick, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
