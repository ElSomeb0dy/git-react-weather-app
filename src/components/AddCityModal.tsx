import React, { useEffect, useRef, useState } from "react";
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
    const [status, setStatus] = useState<{ type: "error" | "success"; text: string } | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

    useEffect(() => {
        if (!status) return;
        const t = setTimeout(() => setStatus(null), 1500);
        return () => clearTimeout(t);
    }, [status]);

    const reset = () => {
        setNewCity("");
        setSuggestions([]);
        setShowSuggestions(false);
        setSelectedSuggestion(null);
        setStatus(null);
    };

    const handleClose = () => { reset(); onClose(); };

    const addCity = async () => {
        const trimmed = newCity.trim();
        if (!trimmed) return;

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
                    setStatus({ type: "error", text: "City not found. Check spelling and try again." });
                    return;
                }
                cityName = fetched[0].name;
                lat = fetched[0].lat;
                lon = fetched[0].lon;
            }
        } catch {
            setStatus({ type: "error", text: "City not found. Check spelling and try again." });
            return;
        }

        if (cities.some((c) => c.toLowerCase() === cityName.toLowerCase())) {
            setStatus({ type: "error", text: "That city is already in your list." });
            return;
        }

        const { error } = await insertCity(cityName, lat, lon);
        if (error) {
            console.warn(error);
            const msg = (error as any).code === "23505"
                ? "That city is already in your list."
                : "Couldn't save city. Please try again.";
            setStatus({ type: "error", text: msg });
            return;
        }

        setStatus({ type: "success", text: `Added ${cityName}.` });
        onCityAdded({ city: cityName, lat, lon });
        setTimeout(() => { reset(); onClose(); }, 1000);
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
                        <Text style={[styles.status, status.type === "error" ? styles.statusError : styles.statusSuccess]}>
                            {status.text}
                        </Text>
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
                                setStatus(null);
                                if (debounceRef.current) clearTimeout(debounceRef.current);
                                const q = t.trim();
                                if (q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
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
                        <Pressable style={[styles.addBtn, { backgroundColor: theme.accent }]} onPress={addCity}>
                            <Text style={styles.addBtnText}>Add</Text>
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

    status: { marginTop: 10, textAlign: "center", fontWeight: "800" },
    statusError: { color: "#DC2626" },
    statusSuccess: { color: "#16A34A" },

    row: { flexDirection: "row", gap: 10 },
    input: { flex: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
    addBtn: { paddingHorizontal: 16, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    addBtnText: { color: "white", fontWeight: "800" },

    suggestBox: { marginTop: 10, borderRadius: 12, overflow: "hidden" },
    suggestRow: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
});
