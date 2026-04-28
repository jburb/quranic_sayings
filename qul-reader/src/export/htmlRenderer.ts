import { QulPassage } from "../types";
import { computeSegments, Span } from "../segmentation";

const HL_COLOR = "#B8860B";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function spansToHtml(spans: Span[]): string {
  return spans
    .map((s) =>
      s.hl
        ? `<span style="color:${HL_COLOR}">${escapeHtml(s.text)}</span>`
        : escapeHtml(s.text)
    )
    .join("");
}

/** Render a single passage to an HTML fragment. */
function passageToHtml(p: QulPassage, highlight: boolean): string {
  const ref =
    p.span > 1
      ? `${p.surah}:${p.start_ayah}\u2013${p.end_ayah}`
      : `${p.surah}:${p.start_ayah}`;

  const segments = computeSegments(p);

  const ayahsHtml = p.ayahs
    .map((a, i) => {
      const body = highlight ? spansToHtml(segments[i]) : escapeHtml(a.text);
      return `<p style="margin:4px 0;line-height:1.6"><span style="font-weight:600;color:#888">${a.ayah}.</span> ${body}</p>`;
    })
    .join("\n");

  return `
<div style="background:#fff;border-radius:10px;padding:16px;margin:8px 0;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
  <p style="font-size:13px;font-weight:700;color:#555;margin:0 0 8px">
    ${escapeHtml(ref)}&ensp;<span style="font-weight:400;font-style:italic">${escapeHtml(p.surah_name)}</span>
  </p>
  ${ayahsHtml}
</div>`;
}

/** Wrap passage fragments in a full HTML document. */
/**
 * Render passages as a self-contained HTML fragment (no <html>/<body> wrapper).
 * Suitable for injecting into a DOM container for html2pdf.js.
 */
export function passagesToHtmlFragment(
  passages: QulPassage[],
  translationLabel: string,
  highlight: boolean
): string {
  const body = passages.map((p) => passageToHtml(p, highlight)).join("\n");
  return `<div style="font-family: Georgia, 'Times New Roman', serif; font-size: 17px; color: #1a1a1a; padding: 16px; max-width: 720px;">
  <h1 style="font-size: 24px; margin: 0 0 4px;">Qul Reader</h1>
  <p style="font-size: 14px; color: #666; margin: 0 0 2px;">Quranic sayings of the Prophet Muhammad PBUH.</p>
  <p style="font-size: 13px; color: #888; margin: 0 0 16px;">${escapeHtml(translationLabel)} — ${passages.length} passages</p>
  ${body}
</div>`;
}

export function passagesToHtmlDocument(
  passages: QulPassage[],
  translationLabel: string,
  highlight: boolean
): string {
  const body = passages.map((p) => passageToHtml(p, highlight)).join("\n");
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Qul Reader — ${escapeHtml(translationLabel)}</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; font-size: 17px; color: #1a1a1a; background: #FAF7F2; padding: 16px; max-width: 720px; margin: 0 auto; }
    h1 { font-size: 24px; margin: 0 0 4px; }
    .tagline { font-size: 14px; color: #666; margin: 0 0 2px; }
    .subtitle { font-size: 13px; color: #888; margin: 0 0 16px; }
  </style>
</head>
<body>
  <h1>Qul Reader</h1>
  <p class="tagline">Quranic sayings of the Prophet Muhammad PBUH.</p>
  <p class="subtitle">${escapeHtml(translationLabel)} — ${passages.length} passages</p>
  ${body}
</body>
</html>`;
}

/**
 * Render passages as XHTML suitable for EPUB.
 * Returns an array of chapter objects (one per group of ~50 passages to keep
 * individual file sizes manageable for e-readers).
 */
export function passagesToXhtmlChapters(
  passages: QulPassage[],
  translationLabel: string,
  highlight: boolean,
  chunkSize = 50
): { filename: string; title: string; xhtml: string }[] {
  const chapters: { filename: string; title: string; xhtml: string }[] = [];

  for (let i = 0; i < passages.length; i += chunkSize) {
    const chunk = passages.slice(i, i + chunkSize);
    const first = chunk[0];
    const last = chunk[chunk.length - 1];
    const idx = Math.floor(i / chunkSize);
    const title = `${first.surah}:${first.start_ayah} – ${last.surah}:${last.start_ayah}`;
    const body = chunk.map((p) => passageToHtml(p, highlight)).join("\n");

    chapters.push({
      filename: `chapter${String(idx).padStart(3, "0")}.xhtml`,
      title,
      xhtml: `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; font-size: 1em; color: #1a1a1a; padding: 1em; }
    h2 { font-size: 1.2em; color: #444; margin: 0 0 0.5em; }
  </style>
</head>
<body>
  <h2>${escapeHtml(title)}</h2>
  ${body}
</body>
</html>`,
    });
  }

  return chapters;
}
