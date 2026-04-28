import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { QulPassage, FontChoice } from "../types";

interface Props {
  passage: QulPassage;
  highlightEnabled: boolean;
  font: FontChoice;
}

const FONT_FAMILIES: Record<FontChoice, string | undefined> = {
  system: undefined,
  serif: "Georgia",
  "noto-serif": "NotoSerif",
};

const SAY_RE = /\bsay\b/gi;

/**
 * Words that, when immediately preceding "say", indicate narrative usage
 * (e.g. "they say", "you say", "would say") rather than the Quranic imperative.
 */
const NARRATIVE_BEFORE = /(?:they|you|we|I|people|who|would|will|shall|could|can|did|to|not|also)\s+$/i;

/** A text span with an optional highlight flag. */
interface Span {
  text: string;
  hl: boolean;
}

/**
 * Find highlighted segments within a single ayah's text.
 *
 * Each imperative "Say" opens a highlighted region that runs through its
 * closing quotation mark. Multiple imperative Says in one ayah each get
 * their own highlighted region. Narrative uses ("they say", etc.) are skipped.
 *
 * @param quoteOpen  Whether we're already inside a quoted Say from a prior ayah.
 * @returns [spans, quoteStillOpen]  —  the text broken into plain/highlighted
 *          spans, plus whether the quote is still open at the end of this ayah.
 */
function segmentAyah(text: string, quoteOpen: boolean): [Span[], boolean] {
  const spans: Span[] = [];
  let pos = 0;
  let inQuote = quoteOpen;

  // If we're already inside a quoted Say from a prior ayah, track quote depth
  // through this ayah to find where it closes.
  if (inQuote) {
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '"') {
        // Toggle: this is either opening a nested quote or closing the current one.
        // Since the Say quote was already open, the first " we see closes it.
        // But we need paired tracking: count opens/closes.
        // Simple toggle: we entered open, so first " closes.
        const closeIdx = i + 1;
        spans.push({ text: text.slice(0, closeIdx), hl: true });
        pos = closeIdx;
        inQuote = false;
        break;
      }
    }
    if (inQuote) {
      // No close quote found — entire ayah is still inside the Say
      spans.push({ text, hl: true });
      return [spans, true];
    }
  }

  // Scan remaining text for imperative Says
  SAY_RE.lastIndex = pos;
  let m: RegExpExecArray | null;
  while ((m = SAY_RE.exec(text)) !== null) {
    const before = text.slice(Math.max(0, m.index - 15), m.index);
    if (NARRATIVE_BEFORE.test(before)) {
      continue; // narrative use
    }

    // Push plain text before this Say
    if (m.index > pos) {
      spans.push({ text: text.slice(pos, m.index), hl: false });
    }

    const sayStart = m.index;

    // Find opening quote after Say
    const quoteStart = text.indexOf('"', m.index + m[0].length);
    if (quoteStart < 0) {
      // No quote — highlight from Say to end of text
      spans.push({ text: text.slice(sayStart), hl: true });
      pos = text.length;
      break;
    }

    // Find the matching close quote (simple toggle)
    let depth = 0;
    let found = false;
    for (let i = quoteStart; i < text.length; i++) {
      if (text[i] === '"') {
        depth = 1 - depth;
        if (depth === 0) {
          // Closing quote found
          spans.push({ text: text.slice(sayStart, i + 1), hl: true });
          pos = i + 1;
          SAY_RE.lastIndex = pos;
          found = true;
          break;
        }
      }
    }

    if (!found) {
      // Quote opened but never closed in this ayah — spans to next ayah
      spans.push({ text: text.slice(sayStart), hl: true });
      pos = text.length;
      inQuote = true;
      break;
    }
  }

  // Push any trailing plain text
  if (pos < text.length) {
    spans.push({ text: text.slice(pos), hl: false });
  }

  return [spans, inQuote];
}

/**
 * Compute highlight segments for all ayahs in a passage.
 * Returns an array (one per ayah) of Span arrays.
 */
function computeSegments(passage: QulPassage): Span[][] {
  let quoteOpen = false;
  return passage.ayahs.map((a) => {
    const [spans, stillOpen] = segmentAyah(a.text, quoteOpen);
    quoteOpen = stillOpen;
    return spans;
  });
}

/**
 * Renders a single qul passage card.
 *
 * When highlighting is enabled, only the "Say …" portion of the text is
 * given a tinted background. Narration preceding the keyword is left plain.
 * For multi-ayah spans, continuation ayahs are highlighted in full.
 */
export default function PassageCard({ passage, highlightEnabled, font }: Props) {
  const fontFamily = FONT_FAMILIES[font];
  const fontStyle = fontFamily ? { fontFamily } : undefined;

  const ref = `${passage.surah}:${passage.start_ayah}`;
  const rangeLabel =
    passage.span > 1
      ? `${passage.surah}:${passage.start_ayah}-${passage.end_ayah}`
      : ref;

  // Pre-compute highlight segments for every ayah in the passage.
  const allSegments = useMemo(() => computeSegments(passage), [passage]);

  return (
    <View style={styles.card}>
      <Text style={styles.header}>
        {rangeLabel}{"  "}
        <Text style={styles.surahName}>{passage.surah_name}</Text>
      </Text>

      {passage.ayahs.map((a, idx) => {
        const segments = allSegments[idx];
        return (
          <Text key={a.ayah} style={[styles.ayahText, fontStyle]}>
            <Text style={styles.ayahNum}>{a.ayah}. </Text>
            {highlightEnabled
              ? segments.map((seg, si) =>
                  seg.hl ? (
                    <Text key={si} style={styles.highlighted}>
                      {seg.text}
                    </Text>
                  ) : (
                    <Text key={si}>{seg.text}</Text>
                  )
                )
              : <Text>{a.text}</Text>}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 6,
    // subtle shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555",
    marginBottom: 8,
  },
  surahName: {
    fontWeight: "400",
    fontStyle: "italic",
  },
  ayahText: {
    fontSize: 17,
    lineHeight: 26,
    color: "#1a1a1a",
    marginBottom: 4,
  },
  ayahNum: {
    fontWeight: "600",
    color: "#888",
  },
  highlighted: {
    backgroundColor: "#FFF3CD",
    borderRadius: 4,
  },
});
