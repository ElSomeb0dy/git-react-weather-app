import React, { useEffect, useRef, useState } from "react";
import { useStatusMessage } from "../hooks/useStatusMessage";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchCitySuggestions, CitySuggestion } from "../services/openWeather";
import { insertCity } from "../services/cities";
import { Theme } from "../theme/weatherTheme";

interface Props {
  visible: boolean;
  cities: string[];
  theme: Theme;
  onClose: () => void;
  onCityAdded: (entry: { city: string; lat: number; lon: number }) => void;
}

export default function AddCityModal({ visible, cities, theme, onClose, onCityAdded }: Props) {
  const [newCity, setNewCity] = useState("");
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<CitySuggestion | null>(null);
  const [adding, setAdding] = useState(false);
  const { status, showError, showSuccess } = useStatusMessage();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  const reset = () => {
    setNewCity("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedSuggestion(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const addCity = async () => {
    const trimmed = newCity.trim();
    if (!trimmed || adding) return;
    setAdding(true);

    setShowSuggestions(false);
    setSuggestions([]);

    let cityName: string;
    let lat: number;
    let lon: number;

    try {
      if (selectedSuggestion) {
        cityName = selectedSuggestion.name;
        lat = selectedSuggestion.lat;

        lon = selectedSuggestion.lon;
      } else {
        const fetched = await fetchCitySuggestions(trimmed);
        if (fetched.length === 0) {
          showError("City not found. Check spelling and try again.");
          return;
        }
        cityName = fetched[0].name;
        lat = fetched[0].lat;
        lon = fetched[0].lon;
      }
    } catch {
      showError("City not found. Check spelling and try again.");
      return;
    } finally {
      setAdding(false);
    }

    if (cities.some((c) => c.toLowerCase() === cityName.toLowerCase())) {
      showError("That city is already in your list.");

      return;
    }

    const { error } = await insertCity(cityName, lat, lon);
    if (error) {
      console.warn(error);
      const msg =
        (error as { code?: string }).code === "23505"
          ? "That city is already in your list."
          : "Couldn't save city. Please try again.";
      showError(msg);

      return;
    }

    showSuccess(`Added ${cityName}.`);
    onCityAdded({ city: cityName, lat, lon });
    setTimeout(() => {
      reset();
      onClose();
    }, 1000);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} pointerEvents="box-only" />
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Add a City</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={theme.text} />
            </Pressable>
          </View>

          {status && (
            <View
              style={[
                styles.statusPill,
                status.type === "error" ? styles.statusPillError : styles.statusPillSuccess,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  status.type === "error" ? styles.statusTextError : styles.statusTextSuccess,
                ]}
              >
                {status.text}
              </Text>
            </View>
          )}

          <View style={styles.row}>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
              placeholder="Search city (e.g., Hong Kong)"
              placeholderTextColor={theme.subtleText}
              value={newCity}
              autoFocus
              onChangeText={(t) => {
                setNewCity(t);
                setSelectedSuggestion(null);
                // status clears automatically via useStatusMessage
                if (debounceRef.current) clearTimeout(debounceRef.current);
                const q = t.trim();
                if (q.length < 2) {
                  setSuggestions([]);
                  setShowSuggestions(false);
                  return;
                }
                debounceRef.current = setTimeout(async () => {
                  try {
                    const list = await fetchCitySuggestions(q);
                    setSuggestions(list);
                    setShowSuggestions(true);
                  } catch {
                    setSuggestions([]);
                  }
                }, 400);
              }}
            />
            <Pressable
              style={[styles.addBtn, { backgroundColor: theme.accent, opacity: adding ? 0.5 : 1 }]}
              onPress={addCity}
              disabled={adding}
            >
              <Text style={styles.addBtnText}>{adding ? "..." : "Add"}</Text>
            </Pressable>
          </View>

          {showSuggestions && suggestions.length > 0 && (
            <FlatList
              data={suggestions}
              keyExtractor={(s) => `${s.lat},${s.lon}`}
              style={[styles.suggestBox, { backgroundColor: theme.card }]}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item: s }) => (
                <Pressable
                  style={[styles.suggestRow, { borderTopColor: theme.subtleText }]}
                  onPress={() => {
                    setNewCity(s.label);
                    setSelectedSuggestion(s);
                    setShowSuggestions(false);
                    setSuggestions([]);
                  }}
                >
                  <Text style={{ color: theme.text, fontWeight: "700" }}>{s.label}</Text>
                </Pressable>
              )}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    gap: 12,
    flex: 1,
    marginTop: 60,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "800", marginBottom: 4 },

  statusPill: {
    alignSelf: "center",
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusPillError: { backgroundColor: "rgba(220,38,38,0.12)" },
  statusPillSuccess: { backgroundColor: "rgba(22,163,74,0.12)" },
  statusText: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  statusTextError: { color: "#DC2626" },
  statusTextSuccess: { color: "#16A34A" },

  row: { flexDirection: "row", gap: 10 },
  input: { flex: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
  addBtn: {
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: "white", fontWeight: "800" },

  suggestBox: { marginTop: 10, borderRadius: 12, overflow: "hidden" },
  suggestRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
