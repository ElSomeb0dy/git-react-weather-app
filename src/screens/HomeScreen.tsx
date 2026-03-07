import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import ThemeBackground from "../components/ThemeBackground";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";
import {
    fetchCurrentWeather,
    fetchCurrentWeatherByCoords,
    fetchCitySuggestions,
    CitySuggestion,
} from "../services/openWeather";
import * as Location from "expo-location";
import { CurrentWeather } from "../types/weather";
import { themeForCondition } from "../theme/weatherTheme";
import CityRow from "../components/CityRow";
import { supabase } from "../services/supabase";
import { loadSettings } from "../storage/settings";
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Alert,
} from "react-native";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

type CityRowDb = {
    city: string;
};

export default function HomeScreen({ navigation }: Props) {

    const [cities, setCities] = useState<string[]>([]);
    const [newCity, setNewCity] = useState("");
    const [loading, setLoading] = useState(true);
    const [weatherMap, setWeatherMap] = useState<Record<string, CurrentWeather>>({});
    const [unit, setUnit] = useState<"C" | "F">("C");

    // On-screen feedback (success/error)
    const [status, setStatus] = useState<{ type: "error" | "success"; text: string } | null>(null);
    const showError = (text: string) => setStatus({ type: "error", text });
    const showSuccess = (text: string) => setStatus({ type: "success", text });
    const clearStatus = () => setStatus(null);

    // Current location weather
    const [locationWeather, setLocationWeather] = useState<CurrentWeather | null>(null);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;
            const loc = await Location.getCurrentPositionAsync({});
            try {
                const w = await fetchCurrentWeatherByCoords(loc.coords.latitude, loc.coords.longitude);
                setLocationWeather(w);
            } catch (e) {
                console.warn("Location weather failed", e);
            }
        })();
    }, []);

    // Autocomplete suggestions
    const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Pick first city's weather as the global screen theme
    const activeTheme = useMemo(() => {
        const first = cities[0] && weatherMap[cities[0]];
        return first ? themeForCondition(first.condition) : themeForCondition("Clouds");
    }, [cities, weatherMap]);

    // Load unit on mount
    useEffect(() => {
        (async () => {
            const s = await loadSettings();
            setUnit(s.unit);
        })();
    }, []);

    // Reload unit whenever Home becomes focused (coming back from Settings)
    useFocusEffect(
        useCallback(() => {
            (async () => {
                const s = await loadSettings();
                setUnit(s.unit);
            })();
        }, [])
    );

    // Load user's cities from Supabase on mount
    useEffect(() => {
        (async () => {
            setLoading(true);

            const { data, error } = await supabase
                .from("user_cities")
                .select("city")
                .order("created_at", { ascending: false })
                .returns<CityRowDb[]>();

            if (error) {
                console.warn(error);
                Alert.alert("Database error", "Couldn't load your saved cities.");
                showError("Couldn't load your saved cities.");
                setCities([]);
                setLoading(false);
                return;
            }

            setCities((data ?? []).map((r) => r.city));
            setLoading(false);
        })();
    }, []);

    // Fetch weather for all cities whenever the list changes
    useEffect(() => {
        (async () => {
            const entries: Array<[string, CurrentWeather]> = [];

            for (const c of cities) {
                try {
                    const w = await fetchCurrentWeather(c);
                    entries.push([c, w]);
                } catch (e) {
                    console.warn("Weather fetch failed for", c, e);
                }
            }

            setWeatherMap(Object.fromEntries(entries));
        })();
    }, [cities]);

    const addCity = async () => {
        const trimmed = newCity.trim();
        if (!trimmed) return;

        // Hide suggestions once we commit to adding
        setShowSuggestions(false);
        setSuggestions([]);

        // If the user didn't tap a suggestion, resolve to the first match
        let city = trimmed;
        const alreadyFormatted = suggestions.some((s) => s.label === trimmed);
        if (!alreadyFormatted) {
            const fetched = suggestions.length > 0 ? suggestions : await fetchCitySuggestions(trimmed);
            if (fetched.length > 0) city = fetched[0].label;
        }

        if (cities.some((c) => c.toLowerCase() === city.toLowerCase())) {
            showError("That city is already in your list.");
            return;
        }

        try {
            await fetchCurrentWeather(city);
        } catch {
            showError("City not found. Check spelling and try again.");
            return;
        }

        const { error } = await supabase.from("user_cities").insert({ city });

        if (error) {
            console.warn(error);
            if ((error as any).code === "23505") {
                showError("That city is already in your list.");
                return;
            }
            showError("Couldn't save city. Please try again.");
            return;
        }

        setCities([city, ...cities]);
        setNewCity("");
        showSuccess(`Added ${city}.`);
    };

    const removeCity = async (city: string) => {
        const { error } = await supabase.from("user_cities").delete().eq("city", city);

        if (error) {
            console.warn(error);
            Alert.alert("Database error", "Couldn't remove that city.");
            showError("Couldn't remove that city.");
            return;
        }

        const updated = cities.filter((c) => c !== city);
        setCities(updated);
        showSuccess(`Removed ${city}.`);
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: "#fff" }]}>
                <ActivityIndicator />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.background }]}>
            <ThemeBackground theme={activeTheme} />

            {locationWeather && (
                <View style={[styles.locationCard, { backgroundColor: activeTheme.card }]}>
                    <Text style={[styles.locationLabel, { color: activeTheme.text }]}>📍 My Location</Text>
                    <Text style={[styles.locationCity, { color: activeTheme.text }]}>
                        {locationWeather.city}, {locationWeather.country}
                    </Text>
                    <Text style={{ color: activeTheme.text }}>
                        {locationWeather.description} • {unit === "C" ? `${locationWeather.tempC}°C` : `${locationWeather.tempF}°F`}
                    </Text>
                </View>
            )}

            <View style={styles.row}>
                <TextInput
                    style={[styles.input, { backgroundColor: activeTheme.card }]}
                    placeholder="Add a city (e.g., London)"
                    value={newCity}
                    onChangeText={(t) => {
                        setNewCity(t);
                        clearStatus();

                        // Debounced suggestions fetch
                        if (debounceRef.current) clearTimeout(debounceRef.current);

                        const q = t.trim();
                        if (q.length < 2) {
                            setSuggestions([]);
                            setShowSuggestions(false);
                            return;
                        }

                        debounceRef.current = setTimeout(async () => {
                            const list = await fetchCitySuggestions(q);
                            setSuggestions(list);
                            setShowSuggestions(true);
                        }, 250);
                    }}
                />
                <Pressable style={[styles.addBtn, { backgroundColor: activeTheme.accent }]} onPress={addCity}>
                    <Text style={styles.addBtnText}>Add</Text>
                </Pressable>
            </View>

            {showSuggestions && suggestions.length > 0 && (
                <View style={[styles.suggestBox, { backgroundColor: activeTheme.card }]}>
                    {suggestions.map((s) => (
                        <Pressable
                            key={`${s.lat},${s.lon}`}                            style={styles.suggestRow}
                            onPress={() => {
                                setNewCity(s.label);
                                setShowSuggestions(false);
                                setSuggestions([]);
                            }}
                        >
                            <Text style={{ color: activeTheme.text, fontWeight: "700" }}>{s.label}</Text>
                        </Pressable>
                    ))}
                </View>
            )}

            {status && (
                <Text style={[styles.status, status.type === "error" ? styles.statusError : styles.statusSuccess]}>
                    {status.text}
                </Text>
            )}

            <View style={styles.rowBetween}>
                <Text style={[styles.h2, { color: activeTheme.text }]}>Locations</Text>
                <Pressable onPress={() => navigation.navigate("Settings")}>
                    <Text style={[styles.link, { color: activeTheme.accent }]}>Settings</Text>
                </Pressable>
            </View>

            <FlatList
                data={cities}
                keyExtractor={(item) => item}
                contentContainerStyle={{ gap: 10, paddingVertical: 12 }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                    <CityRow
                        city={item}
                        weather={weatherMap[item]}
                        unit={unit}
                        onOpen={() => navigation.navigate("WeatherDetail", { city: item })}
                        onRemove={() => removeCity(item)}
                    />
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    container: { flex: 1, padding: 16 },

    row: { flexDirection: "row", gap: 10 },
    rowBetween: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 14,
    },

    input: { flex: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
    addBtn: { paddingHorizontal: 16, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    addBtnText: { color: "white", fontWeight: "800" },

    h2: { fontSize: 20, fontWeight: "800" },
    link: { fontWeight: "800" },

    status: { marginTop: 10, textAlign: "center", fontWeight: "800" },
    statusError: { color: "#DC2626" },
    statusSuccess: { color: "#16A34A" },

    locationCard: {
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
    },
    locationLabel: { fontSize: 12, fontWeight: "700", opacity: 0.6, marginBottom: 2 },
    locationCity: { fontSize: 18, fontWeight: "800" },

    suggestBox: {
        marginTop: 10,
        borderRadius: 12,
        overflow: "hidden",
    },
    suggestRow: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "#D1D5DB",
    },
});