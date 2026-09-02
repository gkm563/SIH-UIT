/**
 * Official SIH 2026 Problem Statements Live Synchronization Script
 * Run: node sync_sih_ps.js
 * Automatically connects to https://www.sih.gov.in/sih2026PS and updates js/data/sih-problem-statements.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'js', 'data', 'sih-problem-statements.js');
const url = 'https://www.sih.gov.in/sih2026PS';

console.log('🔄 Connecting to official SIH portal: https://www.sih.gov.in/sih2026PS ...');

https.get(url, { rejectUnauthorized: false, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
  let html = '';
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    console.log(`✅ Downloaded ${html.length} bytes from SIH.`);

    const modalChunks = html.split(/<div\s+id="ViewProblemStatement/i).slice(1);
    console.log(`Found ${modalChunks.length} problem statements on official portal.`);

    if (modalChunks.length === 0) {
      console.error('❌ No problem statement modals detected.');
      return;
    }

    const allPS = [];

    modalChunks.forEach((chunk, idx) => {
      function extract(fieldName) {
        const reg = new RegExp(`<th[^>]*>\\s*${fieldName}\\s*<\\/th>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`, 'i');
        const m = chunk.match(reg);
        if (!m) return '';
        return m[1]
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/p>/gi, '\n\n')
          .replace(/<li[^>]*>/gi, '• ')
          .replace(/<\/li>/gi, '\n')
          .replace(/<[\s\S]*?>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/&#8226;/g, '•')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/[ \t]+/g, ' ')
          .replace(/\n\s*\n\s*\n+/g, '\n\n')
          .trim();
      }

      const idMatch = chunk.match(/^(\d+)"/);
      const rawId = idMatch ? idMatch[1] : String(idx + 1);

      const psId = extract('Problem Statement ID') || rawId;
      const title = extract('Problem Statement Title');
      const description = extract('Description');
      const organization = extract('Organization') || 'Government / Industry Partner';
      const department = extract('Department');
      const category = extract('Category') || 'Software';
      const theme = extract('Theme') || 'Smart Automation';
      const submissionsRaw = extract('Submitted Idea\\(s\\) Count');
      const submissions = parseInt(submissionsRaw, 10) || 0;

      let youtube = '';
      const ytMatch = chunk.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+/i);
      if (ytMatch) youtube = ytMatch[0];

      let dataset = '';
      const dataMatch = chunk.match(/https?:\/\/(?:drive\.google\.com|www\.sih\.gov\.in\/letters|\S+\.pdf|\S+\.docx|\S+\.xlsx)[^"'\s<>]*/i);
      if (dataMatch) dataset = dataMatch[0];

      if (title) {
        allPS.push({
          sNo: idx + 1,
          psId: psId,
          title: title,
          organization: organization,
          department: department,
          category: category.toLowerCase().includes('hard') ? 'Hardware' : 'Software',
          theme: theme,
          description: description || title,
          submissions: submissions,
          youtubeLink: youtube,
          datasetLink: dataset,
          // Flag the 25 most recent as NEW
          isNew: idx >= (modalChunks.length - 25)
        });
      }
    });

    const softwareCount = allPS.filter(p => p.category === 'Software').length;
    const hardwareCount = allPS.filter(p => p.category === 'Hardware').length;
    const newCount = allPS.filter(p => p.isNew).length;

    console.log(`📊 Parsed ${allPS.length} items: Software: ${softwareCount} | Hardware: ${hardwareCount} | New Flagged: ${newCount}`);

    fs.writeFileSync(
      targetPath,
      `/**
 * Official Smart India Hackathon 2026 Problem Statements Dataset
 * Synchronized directly with https://www.sih.gov.in/sih2026PS
 * Total: ${allPS.length} Problem Statements (Software: ${softwareCount} | Hardware: ${hardwareCount} | Recently Added: ${newCount})
 */
const SIH_PROBLEM_STATEMENTS = ${JSON.stringify(allPS, null, 2)};
`,
      'utf8'
    );

    console.log(`✨ Successfully updated local dataset: ${targetPath}`);
  });
}).on('error', (e) => {
  console.error('❌ Error during sync:', e.message);
});
