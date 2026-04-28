import React, { useState, useCallback, useMemo } from "react";
import { FlatList, SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";
import SettingsBar from "./src/components/SettingsBar";
import PassageCard from "./src/components/PassageCard";
import { getPassages, getTranslationList } from "./src/data";
import { ReaderSettings, QulPassage } from "./src/types";

const translations = getTranslationList();
const defaultTranslation = translations[0]?.id ?? "en.asad";

export default function App() {
  const [settings, setSettings] = useState<ReaderSettings>({
    translation: defaultTranslation,
    highlightEnabled: true,
    font: "system",
  });

  const passages = getPassages(settings.translation);

  const translationLabel = useMemo(
    () => translations.find((t) => t.id === settings.translation)?.label ?? settings.translation,
    [settings.translation]
  );

  const renderItem = useCallback(
    ({ item }: { item: QulPassage }) => (
      <PassageCard
        passage={item}
        highlightEnabled={settings.highlightEnabled}
        font={settings.font}
      />
    ),
    [settings.highlightEnabled, settings.font]
  );

  const keyExtractor = useCallback(
    (item: QulPassage) => `${item.surah}:${item.start_ayah}`,
    []
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F0E8" />
      <View style={styles.titleBar}>
        <Text style={styles.title}>Qul Reader</Text>
        <Text style={styles.tagline}>Quranic sayings of the Prophet Muhammad PBUH.</Text>
        <Text style={styles.subtitle}>{passages.length} passages</Text>
      </View>
      <SettingsBar
        settings={settings}
        onSettingsChange={setSettings}
        passages={passages}
        translationLabel={translationLabel}
      />
      <FlatList
        data={passages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF7F2",
  },
  titleBar: {
    backgroundColor: "#F5F0E8",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2C2C2C",
  },
  tagline: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  subtitle: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  list: {
    paddingVertical: 8,
    paddingBottom: 40,
  },
});
