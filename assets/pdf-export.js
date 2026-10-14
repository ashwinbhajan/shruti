(function (root) {
  'use strict';

  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const MARGIN = 42;

  function asciiSafe(value) {
    return String(value || '')
      .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\u2026/g, '...')
      .replace(/[^\x0A\x20-\x7E]/g, '?');
  }

  function wrap(text, font, size, width) {
    const words = asciiSafe(text).trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const word of words) {
      const candidate = line ? line + ' ' + word : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        line = candidate;
        continue;
      }
      if (line) { lines.push(line); line = ''; }
      if (font.widthOfTextAtSize(word, size) <= width) { line = word; continue; }
      let part = '';
      for (const character of word) {
        if (part && font.widthOfTextAtSize(part + character, size) > width) {
          lines.push(part); part = character;
        } else {
          part += character;
        }
      }
      line = part;
    }
    if (line) lines.push(line);
    return lines;
  }

  async function buildAtsPdfBytes(data, PDFLib) {
    const { PDFDocument, StandardFonts, rgb } = PDFLib;
    const pdf = await PDFDocument.create();
    pdf.setTitle(asciiSafe(data.header.name || 'Resume'));
    pdf.setAuthor(asciiSafe(data.header.name || ''));
    pdf.setSubject('Resume');
    const normal = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const ink = rgb(0.10, 0.15, 0.27);
    const blue = rgb(0.17, 0.42, 0.69);
    const gray = rgb(0.38, 0.43, 0.51);
    let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN;
    const width = PAGE_WIDTH - 2 * MARGIN;

    function ensure(height) {
      if (y - height < MARGIN) {
        page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = PAGE_HEIGHT - MARGIN;
      }
    }
    function line(text, font = normal, size = 9.5, color = ink, indent = 0, leading = size * 1.32) {
      ensure(leading);
      page.drawText(asciiSafe(text), { x: MARGIN + indent, y, size, font, color });
      y -= leading;
    }
    function paragraph(text, font = normal, size = 9.5, color = ink, indent = 0, leading = size * 1.34) {
      const blocks = String(text || '').split('\n');
      for (const block of blocks) {
        if (!block.trim()) { y -= leading * 0.55; continue; }
        for (const part of wrap(block, font, size, width - indent)) line(part, font, size, color, indent, leading);
      }
    }
    function sectionTitle(title) {
      ensure(28);
      y -= 8;
      line(String(title || '').toUpperCase(), bold, 10.5, ink, 0, 14);
      page.drawLine({ start: { x: MARGIN, y: y + 3 }, end: { x: PAGE_WIDTH - MARGIN, y: y + 3 }, thickness: 0.7, color: ink });
      y -= 5;
    }
    function bullet(text) {
      const parts = wrap(text, normal, 9.25, width - 16);
      if (!parts.length) return;
      ensure(parts.length * 12.3);
      line('- ' + parts[0], normal, 9.25, ink, 0, 12.3);
      for (const part of parts.slice(1)) line(part, normal, 9.25, ink, 11, 12.3);
      y -= 2;
    }

    paragraph(data.header.name, bold, 21, ink, 0, 24);
    paragraph(data.header.title, bold, 12.5, blue, 0, 16);
    for (const contact of data.header.contact || []) paragraph(contact, normal, 9.5, gray, 0, 12);
    y -= 4;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1.1, color: ink });
    y -= 6;

    for (const section of data.sections || []) {
      if (section.type === 'spacer') continue;
      if (section.type === 'skills') {
        const estimated = 28 + (section.items || []).reduce((height, item) =>
          height + wrap(item, normal, 9.25, width).length * 12.4 + 2, 0);
        ensure(estimated);
      }
      sectionTitle(section.title);
      if (section.type === 'summary' || section.type === 'languages') {
        paragraph(section.text, normal, 9.5);
        y -= 4;
      } else if (section.type === 'skills') {
        for (const item of section.items || []) { paragraph(item, normal, 9.25); y -= 2; }
        y -= 2;
      } else if (section.type === 'entries') {
        for (const entry of section.entries || []) {
          ensure(42);
          paragraph(entry.role, bold, 10.2, ink, 0, 13);
          if (entry.company) paragraph(entry.company, normal, 9.25, blue, 0, 12);
          if (entry.dates) paragraph(entry.dates, normal, 9, gray, 0, 12);
          if (entry.desc) paragraph(entry.desc, normal, 9.25);
          for (const item of entry.bullets || []) bullet(item);
          y -= 6;
        }
      }
    }
    return pdf.save({ useObjectStreams: false });
  }

  async function downloadAtsPdf() {
    if (!root.PDFLib) {
      root.showToast('PDF library did not load. Use your browser Print > Save as PDF.');
      return;
    }
    try {
      const data = root.extractResumeData();
      if (!data) throw new Error('Resume content is unavailable');
      const content = JSON.stringify(data);
      if (/[^\x0A\x20-\x7E]/.test(content.normalize('NFKD').replace(/[\u0300-\u036f]/g, ''))) {
        root.showToast('Some special characters may change in PDF. Review the downloaded file.');
      }
      const bytes = await buildAtsPdfBytes(data, root.PDFLib);
      root.downloadLocalFile(root.getExportFilename(), bytes, 'application/pdf');
      root.showToast('Text-based PDF downloaded.', 'success');
    } catch (error) {
      root.showToast('PDF export failed: ' + error.message);
    }
  }

  root.downloadAtsPdf = downloadAtsPdf;
  if (typeof module !== 'undefined' && module.exports) module.exports = { buildAtsPdfBytes };
})(typeof window !== 'undefined' ? window : globalThis);
