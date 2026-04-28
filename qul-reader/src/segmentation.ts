import { QulPassage } from "./types";

const SAY_RE = /\bsay\b/gi;
const NARRATIVE_BEFORE = /(?:they|you|we|I|people|who|would|will|shall|could|can|did|to|not|also)\s+$/i;

/** A text span with a highlight flag. */
export interface Span {
  text: string;
  hl: boolean;
}

/**
 * Segment a single ayah's text into highlighted / plain spans.
 *
 * Each imperative "Say" opens a highlighted region through its closing
 * quotation mark. Narrative uses ("they say", etc.) are skipped.
 *
 * @param quoteOpen Whether we're already inside a quoted Say from a prior ayah.
 * @returns [spans, quoteStillOpen]
 */
export function segmentAyah(text: string, quoteOpen: boolean): [Span[], boolean] {
  const spans: Span[] = [];
  let pos = 0;
  let inQuote = quoteOpen;

  if (inQuote) {
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '"') {
        const closeIdx = i + 1;
        spans.push({ text: text.slice(0, closeIdx), hl: true });
        pos = closeIdx;
        inQuote = false;
        break;
      }
    }
    if (inQuote) {
      spans.push({ text, hl: true });
      return [spans, true];
    }
  }

  SAY_RE.lastIndex = pos;
  let m: RegExpExecArray | null;
  while ((m = SAY_RE.exec(text)) !== null) {
    const before = text.slice(Math.max(0, m.index - 15), m.index);
    if (NARRATIVE_BEFORE.test(before)) {
      continue;
    }

    if (m.index > pos) {
      spans.push({ text: text.slice(pos, m.index), hl: false });
    }

    const sayStart = m.index;
    const quoteStart = text.indexOf('"', m.index + m[0].length);
    if (quoteStart < 0) {
      spans.push({ text: text.slice(sayStart), hl: true });
      pos = text.length;
      break;
    }

    let depth = 0;
    let found = false;
    for (let i = quoteStart; i < text.length; i++) {
      if (text[i] === '"') {
        depth = 1 - depth;
        if (depth === 0) {
          spans.push({ text: text.slice(sayStart, i + 1), hl: true });
          pos = i + 1;
          SAY_RE.lastIndex = pos;
          found = true;
          break;
        }
      }
    }

    if (!found) {
      spans.push({ text: text.slice(sayStart), hl: true });
      pos = text.length;
      inQuote = true;
      break;
    }
  }

  if (pos < text.length) {
    spans.push({ text: text.slice(pos), hl: false });
  }

  return [spans, inQuote];
}

/**
 * Compute highlight segments for every ayah in a passage.
 * Returns one Span array per ayah.
 */
export function computeSegments(passage: QulPassage): Span[][] {
  let quoteOpen = false;
  return passage.ayahs.map((a) => {
    const [spans, stillOpen] = segmentAyah(a.text, quoteOpen);
    quoteOpen = stillOpen;
    return spans;
  });
}
