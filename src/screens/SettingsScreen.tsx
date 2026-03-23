import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { RootStackParamList } from "../navigation/types";
import { loadSettings, saveSettings, Settings, HomeThemeMode } from "../storage/settings";
import { signOut } from "../services/auth";

import { WeatherCondition } from "../types/weather";

import { themeForCondition } from "../theme/weatherTheme";
import { commonStyles } from "../styles/common";
import ThemeBackground from "../components/ThemeBackground";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

const FIXED_THEME_OPTIONS: { key: string; label: string }[] = [
  { key: "Clear", label: "Clear" },
  { key: "Clouds", label: "Clouds" },
  { key: "Rain", label: "Rain" },
  { key: "Snow", label: "Snow" },
  { key: "Thunderstorm", label: "Thunderstorm" },
];

const HOME_THEME_OPTIONS: { key: HomeThemeMode; label: string; description: string }[] = [
  {
    key: "location",
    label: "Current Location",
    description: "Matches your device location's weather",
  },
  { key: "top", label: "Top Location", description: "Matches your first saved city" },
  { key: "fixed", label: "Fixed Theme", description: "Always use a specific theme" },
];

export default function SettingsScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<Settings>({
    unit: "C",
    homeTheme: "top",
    fixedTheme: "Clouds",
  });

  useEffect(() => {
    loadSettings()
      .then(setSettings)
      .catch(() => {});
  }, []);

  const update = async (partial: Partial<Settings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    await saveSettings(next);
  };

  const logout = async () => {
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  const themeCondition =
    settings.homeTheme === "fixed"
      ? settings.fixedTheme
      : settings.homeTheme === "location"
        ? route.params.locationCondition
        : route.params.topCondition;
  const themeNight =
    settings.homeTheme === "location"
      ? route.params.locationIsNight
      : settings.homeTheme === "top"
        ? route.params.topIsNight
        : false;
  const theme = themeForCondition(themeCondition as WeatherCondition, themeNight);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ThemeBackground theme={theme} />

      <Pressable
        onPress={() => navigation.goBack()}
        hitSlop={8}
        style={[commonStyles.backBtn, { top: insets.top + 12 }]}
      >
        <Ionicons name="chevron-back" size={26} color={theme.text} />
      </Pressable>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 56 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.h1, { color: theme.text }]}>Settings</Text>

        {/* Temperature unit */}
        <View style={[commonStyles.card, { backgroundColor: theme.card, gap: 12 }]}>
          <Text style={[commonStyles.cardLabel, { color: theme.subtleText }]}>Temperature Unit</Text>
          <View style={styles.segmentRow}>
            {(["C", "F"] as const).map((u) => (
              <Pressable
                key={u}
                style={[styles.segment, settings.unit === u && { backgroundColor: theme.accent }]}
                onPress={() => update({ unit: u })}
              >
                <Text
                  style={[styles.segmentText, { color: settings.unit === u ? "#fff" : theme.text }]}
                >
                  {u === "C" ? "Celsius °C" : "Fahrenheit °F"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Home theme picker */}
        <View style={[commonStyles.card, { backgroundColor: theme.card, gap: 12 }]}>
          <Text style={[commonStyles.cardLabel, { color: theme.subtleText }]}>Home Page Theme</Text>

          {HOME_THEME_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              style={styles.radioRow}
              onPress={() => update({ homeTheme: opt.key })}
            >
              <View
                style={[
                  styles.radioCircle,
                  { borderColor: theme.accent },
                  settings.homeTheme === opt.key && { backgroundColor: theme.accent },
                ]}
              />
              <View style={styles.radioText}>
                <Text style={[styles.radioLabel, { color: theme.text }]}>{opt.label}</Text>
                <Text style={[styles.radioDesc, { color: theme.subtleText }]}>
                  {opt.description}
                </Text>
              </View>
            </Pressable>
          ))}

          {settings.homeTheme === "fixed" && (
            <View style={styles.fixedPicker}>
              {FIXED_THEME_OPTIONS.map((opt) => {
                const t = themeForCondition(opt.key as WeatherCondition);
                const selected = settings.fixedTheme === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    style={styles.dotItem}
                    onPress={() => update({ fixedTheme: opt.key })}
                  >
                    <View
                      style={[styles.dotRing, { borderColor: selected ? t.accent : "transparent" }]}
                    >
                      <View style={[styles.dot, { backgroundColor: t.accent }]} />
                    </View>
                    <Text style={[styles.dotLabel, { color: theme.subtleText }]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Logout */}
        <Pressable style={styles.logout} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 40 },

  h1: { fontSize: 26, fontWeight: "900", marginBottom: 4 },

  segmentRow: { flexDirection: "row", gap: 8 },
  segment: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  segmentText: { fontWeight: "800", fontSize: 14 },

  radioRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
  radioText: { flex: 1 },
  radioLabel: { fontWeight: "800", fontSize: 14 },
  radioDesc: { fontSize: 12, marginTop: 1 },

  fixedPicker: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  dotItem: { alignItems: "center", gap: 5 },
  dotRing: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { width: 16, height: 16, borderRadius: 3 },
  dotLabel: { fontSize: 10, fontWeight: "700" },

  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    backgroundColor: "#EF4444",
    padding: 14,
    borderRadius: 14,
  },
  logoutText: { color: "white", fontWeight: "900", fontSize: 15 },
});
