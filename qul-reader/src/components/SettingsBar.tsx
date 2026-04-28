import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView } from "react-native";
import { ReaderSettings, FontChoice } from "../types";
import { getTranslationList } from "../data";

interface Props {
  settings: ReaderSettings;
  onSettingsChange: (s: ReaderSettings) => void;
}

const FONT_OPTIONS: { id: FontChoice; label: string }[] = [
  { id: "system", label: "System" },
  { id: "serif", label: "Serif" },
  { id: "noto-serif", label: "Noto Serif" },
];

/**
 * A collapsible settings bar at the top of the reader.
 * Allows switching translation, toggling qul highlighting, and choosing a font.
 */
export default function SettingsBar({ settings, onSettingsChange }: Props) {
  const translations = getTranslationList();

  return (
    <View style={styles.container}>
      {/* Translation selector — horizontally scrollable */}
      <View style={styles.row}>
        <Text style={styles.label}>Translation</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollRow}
      >
        {translations.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[
              styles.pill,
              settings.translation === t.id && styles.pillActive,
            ]}
            onPress={() =>
              onSettingsChange({ ...settings, translation: t.id })
            }
          >
            <Text
              style={[
                styles.pillText,
                settings.translation === t.id && styles.pillTextActive,
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Highlight toggle */}
      <View style={styles.row}>
        <Text style={styles.label}>Highlight Qul</Text>
        <Switch
          value={settings.highlightEnabled}
          onValueChange={(v) =>
            onSettingsChange({ ...settings, highlightEnabled: v })
          }
          trackColor={{ false: "#ccc", true: "#C9A84C" }}
          thumbColor={settings.highlightEnabled ? "#fff" : "#f4f3f4"}
        />
      </View>

      {/* Font selector */}
      <View style={styles.row}>
        <Text style={styles.label}>Font</Text>
        <View style={styles.buttonGroup}>
          {FONT_OPTIONS.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.pill,
                settings.font === f.id && styles.pillActive,
              ]}
              onPress={() =>
                onSettingsChange({ ...settings, font: f.id })
              }
            >
              <Text
                style={[
                  styles.pillText,
                  settings.font === f.id && styles.pillTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F5F0E8",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    minWidth: 100,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 6,
  },
  scrollRow: {
    flexDirection: "row",
    gap: 6,
    paddingBottom: 6,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#E8E0D0",
  },
  pillActive: {
    backgroundColor: "#C9A84C",
  },
  pillText: {
    fontSize: 13,
    color: "#555",
  },
  pillTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
});
