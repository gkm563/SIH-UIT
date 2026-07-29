/**
 * Generate SIH 2026 registration receipt as PDF (and optional PNG).
 * Requires jsPDF (window.jspdf.jsPDF) loaded from CDN.
 */
const Receipt = (() => {
  const PRIMARY = [26, 115, 232];
  const TEXT = [32, 33, 36];
  const MUTED = [95, 99, 104];
  const SUCCESS = [24, 128, 56];
  const LINE = [218, 220, 224];

  function getMembers(submission) {
    const f = submission.fields || {};
    const count = submission.teamSize || parseInt(f.teamSize, 10) || 2;
    const members = [];
    for (let i = 1; i < count; i++) {
      if (!f[`member${i}_fullName`]) continue;
      members.push({
        index: i,
        fullName: f[`member${i}_fullName`] || '—',
        rollNumber: f[`member${i}_rollNumber`] || '—',
        collegeId: f[`member${i}_collegeId`] || '—',
        branch: f[`member${i}_branch`] || '—',
        year: f[`member${i}_year`] || '—',
        semester: f[`member${i}_semester`] || '—',
        email: f[`member${i}_email`] || '—',
        whatsapp: f[`member${i}_whatsapp`] || '—'
      });
    }
    return { count, members };
  }

  async function ensureJsPdf() {
    if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
    if (typeof window.jspdf === 'function') return window.jspdf;
    if (window.jsPDF) return window.jsPDF;

    const sources = [
      'js/vendor/jspdf.umd.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js',
      'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js'
    ];

    for (const src of sources) {
      try {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
        if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
        if (typeof window.jspdf === 'function') return window.jspdf;
        if (window.jsPDF) return window.jsPDF;
      } catch (e) {
        // try next source
      }
    }

    throw new Error('PDF library failed to load. Please refresh the page and try again.');
  }

  /**
   * Build and download a PDF receipt.
   */
  async function downloadPdf(submission) {
    const JsPDF = await ensureJsPdf();
    const doc = new JsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 16;
    const contentW = pageW - margin * 2;
    let y = 16;

    const f = submission.fields || {};
    const { count, members } = getMembers(submission);

    // Top accent bar
    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, pageW, 8, 'F');

    y = 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(42, 75, 141);
    doc.text('United Institute of Technology', margin, y);

    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text('Naini, Prayagraj', margin, y);

    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...TEXT);
    doc.text('SIH 2026 Internal Registration', margin, y);

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text('Registration Receipt / Acknowledgement', margin, y);

    // Success badge
    y += 10;
    doc.setFillColor(230, 244, 234);
    doc.roundedRect(margin, y - 5, contentW, 12, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...SUCCESS);
    doc.text('Registration Submitted Successfully', margin + 4, y + 2.5);

    // Meta box
    y += 16;
    doc.setDrawColor(...LINE);
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margin, y, contentW, 28, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text('Registration ID', margin + 4, y + 7);
    doc.text('Submission Date & Time', margin + 4, y + 17);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...PRIMARY);
    doc.text(String(submission.registrationId || '—'), margin + 55, y + 7);

    doc.setFontSize(10);
    doc.setTextColor(...TEXT);
    doc.text(String(submission.submittedAtDisplay || '—'), margin + 55, y + 17);

    // Team section
    y += 36;
    y = sectionTitle(doc, 'Team Details', margin, y, contentW);
    y = kv(doc, 'Team Name', f.teamName || '—', margin, y, contentW);
    y = kv(doc, 'Total Members', String(count), margin, y, contentW);

    // Leader
    y += 4;
    y = sectionTitle(doc, 'Team Leader', margin, y, contentW);
    y = kv(doc, 'Full Name', f.leader_fullName || '—', margin, y, contentW);
    y = kv(doc, 'Roll Number', f.leader_rollNumber || '—', margin, y, contentW);
    y = kv(doc, 'Enrollment No.', f.leader_collegeId || '—', margin, y, contentW);
    y = kv(doc, 'Branch', f.leader_branch || '—', margin, y, contentW);
    y = kv(
      doc,
      'Year / Semester',
      `${f.leader_year || '—'} / ${f.leader_semester || '—'}`,
      margin,
      y,
      contentW
    );
    y = kv(doc, 'Email', f.leader_email || '—', margin, y, contentW);
    y = kv(doc, 'WhatsApp', f.leader_whatsapp || '—', margin, y, contentW);

    // Members
    if (members.length) {
      y += 4;
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      y = sectionTitle(doc, 'Team Members', margin, y, contentW);

      members.forEach((m) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...TEXT);
        doc.text(`Member ${m.index}`, margin, y);
        y += 5;
        y = kv(doc, 'Name', m.fullName, margin, y, contentW);
        y = kv(doc, 'Roll / Branch', `${m.rollNumber} · ${m.branch}`, margin, y, contentW);
        y = kv(doc, 'Email / WhatsApp', `${m.email} · ${m.whatsapp}`, margin, y, contentW);
        y += 3;
      });
    }

    // Note
    if (y > 255) {
      doc.addPage();
      y = 20;
    }
    y += 4;
    doc.setDrawColor(...LINE);
    doc.line(margin, y, margin + contentW, y);
    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...TEXT);
    doc.text('Important Note', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    const note =
      'This receipt confirms Internal Registration for Smart India Hackathon (SIH) 2026 only. ' +
      'It does not guarantee selection or official SIH registration. Further updates will be ' +
      'shared via the registered Email ID and WhatsApp number.';
    const noteLines = doc.splitTextToSize(note, contentW);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4 + 8;

    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text('United Institute of Technology, Naini, Prayagraj · SIH 2026 Internal Registration Portal', margin, y);
    y += 4;
    doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, margin, y);

    // Bottom accent
    doc.setFillColor(...PRIMARY);
    doc.rect(0, 289, pageW, 8, 'F');

    const filename = `${submission.registrationId || 'SIH2026'}_Receipt.pdf`;
    doc.save(filename);
  }

  /**
   * Build a PNG receipt via canvas and download it.
   */
  function downloadPng(submission) {
    const f = submission.fields || {};
    const { count, members } = getMembers(submission);

    const width = 900;
    const rowH = 28;
    const baseH = 520;
    const memberBlock = members.length * 70;
    const height = baseH + memberBlock;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Top bar
    ctx.fillStyle = '#1a73e8';
    ctx.fillRect(0, 0, width, 18);

    let y = 50;
    ctx.fillStyle = '#2A4B8D';
    ctx.font = '700 18px Segoe UI, Arial, sans-serif';
    ctx.fillText('United Institute of Technology', 40, y);

    y += 22;
    ctx.fillStyle = '#5f6368';
    ctx.font = '400 14px Segoe UI, Arial, sans-serif';
    ctx.fillText('Naini, Prayagraj', 40, y);

    y += 30;
    ctx.fillStyle = '#202124';
    ctx.font = '700 28px Segoe UI, Arial, sans-serif';
    ctx.fillText('SIH 2026 Internal Registration', 40, y);

    y += 26;
    ctx.fillStyle = '#5f6368';
    ctx.font = '400 16px Segoe UI, Arial, sans-serif';
    ctx.fillText('Registration Receipt / Acknowledgement', 40, y);

    // Success banner
    y += 24;
    roundRect(ctx, 40, y, width - 80, 44, 8, '#e6f4ea');
    ctx.fillStyle = '#188038';
    ctx.font = '600 18px Segoe UI, Arial, sans-serif';
    ctx.fillText('Registration Submitted Successfully', 56, y + 28);

    // Meta
    y += 64;
    roundRect(ctx, 40, y, width - 80, 90, 8, '#f8f9fa');
    ctx.strokeStyle = '#dadce0';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#5f6368';
    ctx.font = '400 14px Segoe UI, Arial, sans-serif';
    ctx.fillText('Registration ID', 56, y + 28);
    ctx.fillText('Submission Date & Time', 56, y + 62);

    ctx.fillStyle = '#1a73e8';
    ctx.font = '700 20px Segoe UI, Arial, sans-serif';
    ctx.fillText(String(submission.registrationId || '—'), 280, y + 28);

    ctx.fillStyle = '#202124';
    ctx.font = '600 16px Segoe UI, Arial, sans-serif';
    ctx.fillText(String(submission.submittedAtDisplay || '—'), 280, y + 62);

    y += 120;
    y = drawSectionLabel(ctx, 'Team Details', 40, y);
    y = drawKv(ctx, 'Team Name', f.teamName || '—', 40, y, width);
    y = drawKv(ctx, 'Total Members', String(count), 40, y, width);

    y += 12;
    y = drawSectionLabel(ctx, 'Team Leader', 40, y);
    y = drawKv(ctx, 'Full Name', f.leader_fullName || '—', 40, y, width);
    y = drawKv(ctx, 'Roll Number', f.leader_rollNumber || '—', 40, y, width);
    y = drawKv(ctx, 'Enrollment No.', f.leader_collegeId || '—', 40, y, width);
    y = drawKv(ctx, 'Branch', f.leader_branch || '—', 40, y, width);
    y = drawKv(
      ctx,
      'Year / Semester',
      `${f.leader_year || '—'} / ${f.leader_semester || '—'}`,
      40,
      y,
      width
    );
    y = drawKv(ctx, 'Email', f.leader_email || '—', 40, y, width);
    y = drawKv(ctx, 'WhatsApp', f.leader_whatsapp || '—', 40, y, width);

    if (members.length) {
      y += 12;
      y = drawSectionLabel(ctx, 'Team Members', 40, y);
      members.forEach((m) => {
        ctx.fillStyle = '#202124';
        ctx.font = '700 15px Segoe UI, Arial, sans-serif';
        ctx.fillText(`Member ${m.index}: ${m.fullName}`, 40, y);
        y += 22;
        y = drawKv(ctx, 'Roll / Branch', `${m.rollNumber} · ${m.branch}`, 40, y, width);
        y = drawKv(ctx, 'Contact', `${m.email} · ${m.whatsapp}`, 40, y, width);
        y += 8;
      });
    }

    y += 10;
    ctx.strokeStyle = '#dadce0';
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(width - 40, y);
    ctx.stroke();

    y += 28;
    ctx.fillStyle = '#5f6368';
    ctx.font = '400 13px Segoe UI, Arial, sans-serif';
    const note =
      'This receipt confirms Internal Registration for SIH 2026 only and does not guarantee selection.';
    ctx.fillText(note, 40, y);
    y += 22;
    ctx.fillText('United Institute of Technology, Naini, Prayagraj · SIH 2026', 40, y);

    // Bottom bar
    ctx.fillStyle = '#1a73e8';
    ctx.fillRect(0, height - 18, width, 18);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${submission.registrationId || 'SIH2026'}_Receipt.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  function sectionTitle(doc, title, x, y, w) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...PRIMARY);
    doc.text(title, x, y);
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.4);
    doc.line(x, y + 1.5, x + w, y + 1.5);
    return y + 8;
  }

  function kv(doc, label, value, x, y, w) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(label, x, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXT);
    const lines = doc.splitTextToSize(String(value), w - 50);
    doc.text(lines, x + 48, y);
    return y + Math.max(6, lines.length * 4.5);
  }

  function drawSectionLabel(ctx, title, x, y) {
    ctx.fillStyle = '#1a73e8';
    ctx.font = '700 16px Segoe UI, Arial, sans-serif';
    ctx.fillText(title, x, y);
    ctx.strokeStyle = '#1a73e8';
    ctx.beginPath();
    ctx.moveTo(x, y + 6);
    ctx.lineTo(x + 820, y + 6);
    ctx.stroke();
    return y + 28;
  }

  function drawKv(ctx, label, value, x, y, width) {
    ctx.fillStyle = '#5f6368';
    ctx.font = '400 14px Segoe UI, Arial, sans-serif';
    ctx.fillText(label, x, y);
    ctx.fillStyle = '#202124';
    ctx.font = '600 14px Segoe UI, Arial, sans-serif';
    ctx.fillText(String(value), x + 160, y);
    return y + 24;
  }

  function roundRect(ctx, x, y, w, h, r, fill) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  return { downloadPdf };
})();
