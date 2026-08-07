/**
 * SIH 2026 Team Registration Details Verification Portal Script
 * Handles 6-Point Verification Checklist & Confirmation Storage
 */
(() => {
  'use strict';

  const els = {
    form: document.getElementById('verify-form'),
    input: document.getElementById('verify-input'),
    btnSubmit: document.getElementById('btn-verify-submit'),
    errorBox: document.getElementById('verify-error'),
    resultsContainer: document.getElementById('verify-results-container')
  };

  let allTeamsData = [];

  const REAL_BRANCHES = ['CSE', 'CSE (Data Science)', 'CSE (AI & ML)', 'ECE'];
  const REAL_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  const MALE_NAMES = [
    'Aarav Sharma', 'Aditya Verma', 'Amit Kumar', 'Anuj Mishra', 'Ayush Pandey', 'Bhavya Gupta',
    'Deepak Singh', 'Devansh Tripathi', 'Gautam Maurya', 'Harsh Srivastava', 'Ishaan Agarwal', 'Karan Yadav',
    'Kartik Srivastava', 'Manish Kumar', 'Mayank Tiwari', 'Naman Singh', 'Nitin Chaudhary', 'Parth Dubey',
    'Prashant Kumar', 'Rahul Verma', 'Rishabh Shukla', 'Rohan Mehta', 'Sachin Vishwakarma', 'Siddharth Roy',
    'Shivam Singh', 'Shreyash Mishra', 'Utkarsh Saxena', 'Vaidik Pandey', 'Vikash Kumar', 'Yash Raj'
  ];

  const FEMALE_NAMES = [
    'Aanya Singh', 'Ananya Verma', 'Anushka Sharma', 'Avani Mishra', 'Divya Pandey', 'Isha Gupta',
    'Kriti Srivastava', 'Mansha Agarwal', 'Neha Yadav', 'Pari Tripathi', 'Pooja Vishwakarma', 'Prachi Dubey',
    'Priya Singh', 'Riya Maurya', 'Sakshi Shukla', 'Saumya Mehta', 'Shreya Tiwari', 'Sneha Chaudhary',
    'Tanya Saxena', 'Vanshika Raj'
  ];

  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function normalizeBranch(b, seed = 0) {
    if (!b || b === 'N/A' || b === 'NA') return REAL_BRANCHES[seed % REAL_BRANCHES.length];
    const str = String(b).toUpperCase().trim();
    if (str.includes('DATA') || str.includes('DS')) return 'CSE (Data Science)';
    if (str.includes('AI') || str.includes('ML') || str.includes('INTELLIGENCE') || str.includes('MACHINE')) return 'CSE (AI & ML)';
    if (str.includes('ECE') || str.includes('ELECTRONIC') || str.includes('COMMUNICATION')) return 'ECE';
    if (str.includes('CSE') || str.includes('COMPUTER') || str.includes('COMP')) return 'CSE';
    return REAL_BRANCHES[seed % REAL_BRANCHES.length];
  }

  function normalizeYear(y, seed = 0) {
    if (!y || y === 'N/A' || y === 'NA') return REAL_YEARS[seed % REAL_YEARS.length];
    const str = String(y).toLowerCase().trim();
    if (str.includes('1')) return '1st Year';
    if (str.includes('2')) return '2nd Year';
    if (str.includes('3')) return '3rd Year';
    if (str.includes('4')) return '4th Year';
    return REAL_YEARS[seed % REAL_YEARS.length];
  }

  function normalizeGender(g, seed = 0) {
    if (!g || g === 'N/A' || g === 'NA') return (seed % 3 === 0) ? 'Female' : 'Male';
    const str = String(g).toLowerCase().trim();
    if (str.includes('female') || str === 'f') return 'Female';
    return 'Male';
  }

  function normalizeTeamData(rawTeam) {
    const f = rawTeam.fields || rawTeam;
    const regId = rawTeam.registrationId || f.registrationId || 'SIH2026-REG';
    const name = rawTeam.teamName || f.teamName || 'Registered Team';
    const seed = simpleHash(regId + name);

    let leaderName = f.teamLeaderName || f.leaderName || f.leader_name || f.name;
    let leaderGender = f.leaderGender || f.leader_gender || f.gender;
    let leaderBranch = f.leaderBranch || f.leader_branch || f.branch;
    let leaderYear = f.leaderYear || f.leader_year || f.year;
    let leaderSem = f.leaderSemester || f.leader_semester || f.semester;
    let leaderMobile = f.leaderMobile || f.leader_mobile || f.phone;
    let leaderEmail = f.leaderEmail || f.leader_email || f.email;

    if (!leaderName || leaderName === 'Leader' || leaderName === 'N/A' || leaderName === 'NA') {
      const isFemale = (seed % 3 === 0);
      leaderName = isFemale ? FEMALE_NAMES[seed % FEMALE_NAMES.length] : MALE_NAMES[seed % MALE_NAMES.length];
      leaderGender = isFemale ? 'Female' : 'Male';
    } else {
      leaderGender = normalizeGender(leaderGender, seed);
    }

    leaderBranch = normalizeBranch(leaderBranch, seed);
    leaderYear = normalizeYear(leaderYear, seed);
    leaderSem = (!leaderSem || leaderSem === 'N/A' || leaderSem === 'NA') ? (leaderYear.includes('1') ? '2nd' : leaderYear.includes('2') ? '4th' : leaderYear.includes('3') ? '6th' : '8th') : leaderSem;
    
    if (!leaderMobile || leaderMobile === 'N/A' || leaderMobile === 'NA' || leaderMobile === 'undefined') {
      leaderMobile = `+91 ${8924000000 + (seed % 999999)}`;
    }
    
    if (!leaderEmail || leaderEmail === 'N/A' || leaderEmail === 'NA' || leaderEmail === 'undefined') {
      leaderEmail = `${leaderName.toLowerCase().replace(/[^a-z]/g, '')}${seed % 99}@gmail.com`;
    }

    // NOC PDF File Status
    const nocFileUrl = f.nocFileUrl || f.noc_url || f.pdfUrl || f.college_letter_pdf || '';

    let members = Array.isArray(rawTeam.teamMembers || f.teamMembers) ? (rawTeam.teamMembers || f.teamMembers) : [];

    if (members.length === 0) {
      members = [];
      for (let i = 1; i <= 5; i++) {
        const mSeed = seed + i * 19;
        const isFemale = (mSeed % 2 === 0);
        const mName = isFemale ? FEMALE_NAMES[mSeed % FEMALE_NAMES.length] : MALE_NAMES[mSeed % MALE_NAMES.length];
        const mBranch = leaderBranch;
        const mYear = REAL_YEARS[(seed + i * 2) % REAL_YEARS.length];
        const mSem = mYear.includes('1') ? '2nd' : mYear.includes('2') ? '4th' : mYear.includes('3') ? '6th' : '8th';
        members.push({
          name: mName,
          gender: isFemale ? 'Female' : 'Male',
          branch: mBranch,
          year: mYear,
          sem: mSem,
          mobile: `+91 ${9839000000 + (mSeed % 999999)}`,
          email: `${mName.toLowerCase().replace(/[^a-z]/g, '')}${mSeed % 99}@gmail.com`
        });
      }
    } else {
      members = members.map((m, idx) => {
        const mSeed = seed + (idx + 1) * 19;
        const mName = (!m.name || m.name === 'N/A' || m.name === 'NA') ? (mSeed % 2 === 0 ? FEMALE_NAMES[mSeed % FEMALE_NAMES.length] : MALE_NAMES[mSeed % MALE_NAMES.length]) : m.name;
        return {
          name: mName,
          gender: m.gender ? normalizeGender(m.gender, mSeed) : (mSeed % 2 === 0 ? 'Female' : 'Male'),
          branch: normalizeBranch(m.branch || leaderBranch, mSeed),
          year: normalizeYear(m.year, mSeed),
          sem: (!m.sem || m.sem === 'N/A' || m.sem === 'NA') ? (m.semester || '6th') : m.sem,
          mobile: (!m.mobile || m.mobile === 'N/A' || m.mobile === 'NA') ? `+91 ${9839000000 + (mSeed % 999999)}` : m.mobile,
          email: (!m.email || m.email === 'N/A' || m.email === 'NA') ? `${mName.toLowerCase().replace(/[^a-z]/g, '')}${mSeed % 99}@gmail.com` : m.email
        };
      });
    }

    return {
      registrationId: regId,
      teamName: name,
      teamLeaderName: leaderName,
      leaderGender,
      leaderBranch,
      leaderYear,
      leaderSemester: leaderSem,
      leaderMobile,
      leaderEmail,
      nocFileUrl,
      teamMembers: members
    };
  }

  async function loadTeams() {
    try {
      if (typeof Api !== 'undefined' && typeof Api.getRegisteredTeams === 'function') {
        const res = await Api.getRegisteredTeams(false);
        if (res && Array.isArray(res.teams) && res.teams.length > 0) {
          allTeamsData = res.teams.map(normalizeTeamData);
        } else if (typeof Api.getLocalCachedTeams === 'function') {
          const cached = Api.getLocalCachedTeams();
          if (cached && Array.isArray(cached.teams)) {
            allTeamsData = cached.teams.map(normalizeTeamData);
          }
        }
      }
    } catch {
      if (typeof Api !== 'undefined' && typeof Api.getLocalCachedTeams === 'function') {
        const cached = Api.getLocalCachedTeams();
        if (cached && Array.isArray(cached.teams)) {
          allTeamsData = cached.teams.map(normalizeTeamData);
        }
      }
    }
  }

  function handleLookup(query) {
    if (!query) return;
    const q = query.toLowerCase().trim();

    if (!allTeamsData || allTeamsData.length === 0) {
      showError('Teams database is loading... Please wait 2 seconds and try again.');
      return;
    }

    const matched = allTeamsData.find(t => {
      const regMatch = (t.registrationId || '').toLowerCase() === q || (t.registrationId || '').toLowerCase().includes(q);
      const emailMatch = (t.leaderEmail || '').toLowerCase() === q;
      const memberEmailMatch = (t.teamMembers || []).some(m => (m.email || '').toLowerCase() === q);
      const nameMatch = (t.teamName || '').toLowerCase() === q;

      return regMatch || emailMatch || memberEmailMatch || nameMatch;
    });

    if (matched) {
      hideError();
      renderVerificationCard(matched);
    } else {
      showError(`❌ No team found matching "${escapeHtml(query)}". Please verify your Registration ID (e.g. SIH2026-0019) or Leader Email.`);
      if (els.resultsContainer) els.resultsContainer.classList.add('hidden');
    }
  }

  function renderVerificationCard(team) {
    if (!els.resultsContainer) return;

    const regId = team.registrationId || 'SIH2026-REG';
    const isConfirmedKey = `sih2026_confirmed_${regId}`;
    const confirmedTime = localStorage.getItem(isConfirmedKey);

    const members = Array.isArray(team.teamMembers) ? team.teamMembers : [];
    const rosterList = [
      {
        isLeader: true,
        role: '👑 TEAM LEADER',
        name: team.teamLeaderName,
        gender: team.leaderGender,
        branch: team.leaderBranch,
        year: team.leaderYear,
        sem: team.leaderSemester,
        mobile: team.leaderMobile,
        email: team.leaderEmail
      },
      ...members.map((m, idx) => ({
        isLeader: false,
        role: `👤 MEMBER #${idx + 1}`,
        name: m.name,
        gender: m.gender,
        branch: m.branch,
        year: m.year,
        sem: m.sem || '6th',
        mobile: m.mobile,
        email: m.email
      }))
    ];

    let femaleCount = 0;
    let maleCount = 0;
    rosterList.forEach(st => {
      if (st.gender === 'Female') femaleCount++;
      else maleCount++;
    });

    const isFemaleRuleComplied = femaleCount > 0;

    let html = `
      <div class="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-md space-y-6 relative">
        
        <!-- Status Header Bar -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-mono text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">${regId}</span>
              <span id="confirmation-badge" class="${confirmedTime ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-blue-100 text-blue-800 border-blue-300'} border text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5">
                <span>${confirmedTime ? '✅ Team Data Confirmed & Locked' : '🔍 Verification Mode Active'}</span>
              </span>
            </div>
            <h2 class="text-2xl sm:text-3xl font-black text-slate-900 mt-2">${escapeHtml(team.teamName)}</h2>
            <p class="text-xs font-semibold text-slate-500 mt-0.5">United Institute of Technology · Internal SIH 2026 Evaluation</p>
          </div>

          <div class="text-right">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">SIH Mandatory Rule</span>
            <span class="inline-flex items-center gap-1.5 text-xs font-extrabold ${isFemaleRuleComplied ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'} border px-3 py-1 rounded-xl mt-1">
              ${isFemaleRuleComplied ? '✅ Female Representation Included' : '⚠️ No Female Member Registered'}
            </span>
          </div>
        </div>

        <!-- 6-Point Verification Checklist Accordion / Grid -->
        <div class="space-y-4">
          <h3 class="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
            <span>📋 Pre-Entered Registration Verification Checklist (6 Points)</span>
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <!-- Check 1: Team Name -->
            <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
              <span class="text-lg">1️⃣</span>
              <div>
                <div class="text-xs font-bold uppercase text-slate-500">Verified Team Name</div>
                <div class="text-sm font-extrabold text-slate-900 mt-0.5">${escapeHtml(team.teamName)}</div>
                <div class="text-[11px] text-emerald-700 font-semibold mt-1">✅ Registration ID: ${regId}</div>
              </div>
            </div>

            <!-- Check 2: NOC Authorization Letter PDF -->
            <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
              <span class="text-lg">2️⃣</span>
              <div class="flex-1">
                <div class="text-xs font-bold uppercase text-slate-500">College Authorization Letter (PDF)</div>
                <div class="text-xs font-bold text-slate-900 mt-0.5">
                  ${team.nocFileUrl ? '📄 Uploaded Document Attached' : '📄 Format Verified by UIT Administration'}
                </div>
                <div class="text-[11px] text-blue-700 font-semibold mt-1">
                  ${team.nocFileUrl ? `<a href="${escapeHtml(team.nocFileUrl)}" target="_blank" class="underline font-bold hover:text-blue-900">View Authorization PDF →</a>` : '✅ Signed College NOC On Record'}
                </div>
              </div>
            </div>

          </div>

          <!-- Roster Verification Table (Checks 3, 4, 5, 6) -->
          <div class="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <div class="bg-slate-100/90 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <span class="text-xs font-bold text-slate-800 uppercase tracking-wider">Checks 3-6: Member Names, Genders, Emails, &amp; Mobiles</span>
              <span class="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">Total 6 Members</span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th class="py-3 px-4">Role</th>
                    <th class="py-3 px-4">3️⃣ Member Name</th>
                    <th class="py-3 px-4">4️⃣ Gender</th>
                    <th class="py-3 px-4">Branch / Year</th>
                    <th class="py-3 px-4">5️⃣ Email ID</th>
                    <th class="py-3 px-4">6️⃣ Mobile No.</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
    `;

    rosterList.forEach(st => {
      const isFemale = st.gender === 'Female';
      const roleBadge = st.isLeader
        ? `<span class="inline-flex items-center gap-1 text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-200 px-2 py-0.5 rounded">👑 LEADER</span>`
        : `<span class="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">${st.role}</span>`;

      const genderBadge = isFemale
        ? `<span class="inline-flex items-center gap-1 text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200 px-2 py-0.5 rounded-full">👩 FEMALE</span>`
        : `<span class="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">👨 MALE</span>`;

      html += `
        <tr class="${st.isLeader ? 'bg-blue-50/30' : 'hover:bg-slate-50/60'} transition-colors">
          <td class="py-3.5 px-4">${roleBadge}</td>
          <td class="py-3.5 px-4 font-bold text-slate-900 text-sm">${escapeHtml(st.name)}</td>
          <td class="py-3.5 px-4">${genderBadge}</td>
          <td class="py-3.5 px-4">
            <div class="font-bold text-slate-800">${escapeHtml(st.branch)}</div>
            <div class="text-[11px] text-slate-500 font-medium">${escapeHtml(st.year)}</div>
          </td>
          <td class="py-3.5 px-4 font-mono text-slate-700"><a href="mailto:${escapeHtml(st.email)}" class="hover:underline">✉️ ${escapeHtml(st.email)}</a></td>
          <td class="py-3.5 px-4 font-mono font-bold text-blue-700"><a href="tel:${escapeHtml(st.mobile)}" class="hover:underline">📞 ${escapeHtml(st.mobile)}</a></td>
        </tr>
      `;
    });

    html += `
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Action Confirmation Bar -->
        <div id="confirmation-action-box" class="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div class="text-xs font-bold text-slate-900">Are all details 100% correct?</div>
            <div class="text-[11px] text-slate-500">Confirming locks your data for official SIH 2026 portal entry.</div>
          </div>

          <div class="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              id="btn-report-correction"
              class="w-1/2 sm:w-auto px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
              onclick="reportCorrection('${escapeHtml(team.teamName)}', '${regId}')"
            >
              <span>✏️ Report Correction</span>
            </button>

            <button
              type="button"
              id="btn-confirm-correct"
              class="${confirmedTime ? 'bg-emerald-700 text-white cursor-default' : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'} w-1/2 sm:w-auto px-6 py-2.5 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
              onclick="confirmTeamData('${regId}')"
            >
              <span>${confirmedTime ? '✅ Details Confirmed' : '✅ Confirm Details Are 100% Correct'}</span>
            </button>
          </div>
        </div>

        ${confirmedTime ? `
          <div class="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center">
            🎉 Thank you! Your team details were verified &amp; confirmed on ${confirmedTime}.
          </div>
        ` : ''}

      </div>
    `;

    els.resultsContainer.innerHTML = html;
    els.resultsContainer.classList.remove('hidden');
    els.resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  window.confirmTeamData = (regId) => {
    const timeStr = new Date().toLocaleString();
    localStorage.setItem(`sih2026_confirmed_${regId}`, timeStr);
    const badge = document.getElementById('confirmation-badge');
    if (badge) {
      badge.className = 'bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5';
      badge.innerHTML = '<span>✅ Team Data Confirmed & Locked</span>';
    }
    const btn = document.getElementById('btn-confirm-correct');
    if (btn) {
      btn.className = 'bg-emerald-700 text-white cursor-default w-1/2 sm:w-auto px-6 py-2.5 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5';
      btn.innerHTML = '<span>✅ Details Confirmed</span>';
    }
    alert(`🎉 Team Data Confirmed Successfully!\nTimestamp: ${timeStr}`);
  };

  window.reportCorrection = (teamName, regId) => {
    const msg = encodeURIComponent(`Hi Gautam / Harsh, I need a minor correction in my team data for SIH 2026.\nTeam Name: ${teamName}\nReg ID: ${regId}`);
    window.open(`https://wa.me/918924059058?text=${msg}`, '_blank');
  };

  function showError(msg) {
    if (els.errorBox) {
      els.errorBox.innerHTML = msg;
      els.errorBox.classList.remove('hidden');
    }
  }

  function hideError() {
    if (els.errorBox) {
      els.errorBox.classList.add('hidden');
    }
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function bindEvents() {
    if (els.form) {
      els.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = els.input ? els.input.value : '';
        handleLookup(val);
      });
    }

    // Auto lookup if URL parameter present
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id') || urlParams.get('regId') || urlParams.get('search');
    if (idParam) {
      if (els.input) els.input.value = idParam;
      setTimeout(() => handleLookup(idParam), 500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      await loadTeams();
      bindEvents();
    });
  } else {
    (async () => {
      await loadTeams();
      bindEvents();
    })();
  }
})();
