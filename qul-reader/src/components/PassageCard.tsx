import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { QulPassage, FontChoice } from "../types";
import { computeSegments } from "../segmentation";

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
    color: "#B8860B",
  },
});
