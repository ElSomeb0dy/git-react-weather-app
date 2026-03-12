import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import ThemeBackground from "../components/ThemeBackground";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
    fetchCurrentWeather,
    fetchCurrentWeatherByCoords,
    fetchCitySuggestions,
    fetchNextSlots,
    CitySuggestion,
} from "../services/openWeather";
import * as Location from "expo-location";
import { CurrentWeather, ForecastSlot } from "../types/weather";
import { tempColor } from "../utils/tempColor";
import { formatTemp } from "../utils/format";
import { useLocalTime } from "../utils/useLocalTime";
import { themeForCondition, isNightTime } from "../theme/weatherTheme";
import CityRow from "../components/CityRow";
import { getCities, insertCity, deleteCity } from "../services/cities";
import { loadSettings, HomeThemeMode } from "../storage/settings";
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    FlatList,
    ScrollView,
    Image,
    ActivityIndicator,
    Alert,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from "react-native";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;


function getGreeting(): string {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Good morning";
    if (h >= 12 && h < 17) return "Good afternoon";
    if (h >= 17 && h < 21) return "Good evening";
    return "Good night";
}

export default function HomeScreen({ navigation }: Props) {

    const insets = useSafeAreaInsets();
    const [cities, setCities] = useState<string[]>([]);
    const [newCity, setNewCity] = useState("");
    const [loading, setLoading] = useState(true);
    const [weatherMap, setWeatherMap] = useState<Record<string, CurrentWeather>>({});
    const [unit, setUnit] = useState<"C" | "F">("C");
    const [homeTheme, setHomeTheme] = useState<HomeThemeMode>("top");
    const [fixedTheme, setFixedTheme] = useState("Clouds");

    // On-screen feedback (success/error)
    const [status, setStatus] = useState<{ type: "error" | "success"; text: string } | null>(null);
    const showError = (text: string) => setStatus({ type: "error", text });
    const showSuccess = (text: string) => setStatus({ type: "success", text });
    const clearStatus = () => setStatus(null);

    useEffect(() => {
        if (!status) return;
        const t = setTimeout(clearStatus, 1500);
        return () => clearTimeout(t);
    }, [status]);

    // Current location weather
    const [locationWeather, setLocationWeather] = useState<CurrentWeather | null>(null);
    const locationLocalTime = useLocalTime(locationWeather?.timezone);
    const [locationSlots, setLocationSlots] = useState<ForecastSlot[]>([]);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;
            const loc = await Location.getCurrentPositionAsync({});
            try {
                const w = await fetchCurrentWeatherByCoords(loc.coords.latitude, loc.coords.longitude);
                setLocationWeather(w);
                const slots = await fetchNextSlots(w.city);
                setLocationSlots(slots);
            } catch (e) {
                console.warn("Location weather failed", e);
            }
        })();
    }, []);

    // Add city input visibility
    const [showInput, setShowInput] = useState(false);
    const inputRef = useRef<TextInput>(null);

    const closeModal = () => { setShowInput(false); setNewCity(""); setSuggestions([]); setShowSuggestions(false); setSelectedSuggestion(null); };

    // Autocomplete suggestions
    const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestion, setSelectedSuggestion] = useState<CitySuggestion | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

    // Derive active condition + theme based on homeTheme setting
    const { activeTheme, locationCondition, locationIsNight, topCondition, topIsNight } = useMemo(() => {
        let condition: string;
        let sourceWeather: typeof locationWeather | undefined;
        if (homeTheme === "location") {
            condition = locationWeather?.condition ?? "Clouds";
            sourceWeather = locationWeather;
        } else if (homeTheme === "fixed") {
            condition = fixedTheme;
        } else {
            const first = cities.length > 0 ? weatherMap[cities[0]] : undefined;
            condition = first?.condition ?? "Clouds";
            sourceWeather = first;
        }
        const night = isNightTime(sourceWeather?.sunrise ?? null, sourceWeather?.sunset ?? null);
        const locNight = isNightTime(locationWeather?.sunrise ?? null, locationWeather?.sunset ?? null);
        const topWeather = cities.length > 0 ? weatherMap[cities[0]] : undefined;
        const topNight = isNightTime(topWeather?.sunrise ?? null, topWeather?.sunset ?? null);
        return {
            activeTheme: themeForCondition(condition as any, night),
            activeCondition: condition,
            activeNight: night,
            locationCondition: locationWeather?.condition ?? "Clouds",
            locationIsNight: locNight,
            topCondition: topWeather?.condition ?? "Clouds",
            topIsNight: topNight,
        };
    }, [cities, weatherMap, locationWeather, homeTheme, fixedTheme]);

    // Load all settings on focus
    useFocusEffect(
        useCallback(() => {
            loadSettings().then((s) => {
                setUnit(s.unit);
                setHomeTheme(s.homeTheme);
                setFixedTheme(s.fixedTheme);
            });
        }, [])
    );

    // Load user's cities from Supabase on mount
    useEffect(() => {
        (async () => {
            setLoading(true);

            const { data, error } = await getCities();

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
            const results = await Promise.allSettled(cities.map((c) => fetchCurrentWeather(c)));
            const entries: Array<[string, CurrentWeather]> = [];
            results.forEach((result, i) => {
                if (result.status === "fulfilled") entries.push([cities[i], result.value]);
                else console.warn("Weather fetch failed for", cities[i], result.reason);
            });
            setWeatherMap(Object.fromEntries(entries));
        })();
    }, [cities]);

    const addCity = async () => {
        const trimmed = newCity.trim();
        if (!trimmed) return;

        setShowSuggestions(false);
        setSuggestions([]);

        let weatherResult;
        let cityName: string;

        if (selectedSuggestion) {
            // Use lat/lon from the suggestion — always works
            try {
                weatherResult = await fetchCurrentWeatherByCoords(selectedSuggestion.lat, selectedSuggestion.lon);
                cityName = weatherResult.city;
            } catch {
                showError("City not found. Check spelling and try again.");
                return;
            }
        } else {
            // Free-text fallback: try geocoding first
            try {
                const fetched = await fetchCitySuggestions(trimmed);
                if (fetched.length > 0) {
                    weatherResult = await fetchCurrentWeatherByCoords(fetched[0].lat, fetched[0].lon);
                    cityName = weatherResult.city;
                } else {
                    showError("City not found. Check spelling and try again.");
                    return;
                }
            } catch {
                showError("City not found. Check spelling and try again.");
                return;
            }
        }

        if (cities.some((c) => c.toLowerCase() === cityName.toLowerCase())) {
            showError("That city is already in your list.");
            return;
        }

        const { error } = await insertCity(cityName);

        if (error) {
            console.warn(error);
            if ((error as any).code === "23505") {
                showError("That city is already in your list.");
                return;
            }
            showError("Couldn't save city. Please try again.");
            return;
        }

        setCities([cityName, ...cities]);
        setNewCity("");
        showSuccess(`Added ${cityName}.`);
        setTimeout(() => { setShowInput(false); setSuggestions([]); setShowSuggestions(false); setSelectedSuggestion(null); }, 1000);
    };

    const removeCity = async (city: string) => {
        const { error } = await deleteCity(city);

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
        <View style={[styles.container, { backgroundColor: activeTheme.background, paddingTop: insets.top + 16 }]}>
            <ThemeBackground theme={activeTheme} />

            <View style={styles.greetingRow}>
                <Text style={[styles.greeting, { color: activeTheme.text }]}>{getGreeting()}</Text>
                <Pressable onPress={() => navigation.navigate("Settings", { locationCondition, locationIsNight, topCondition, topIsNight })} hitSlop={8}>
                    <Ionicons name="settings-outline" size={22} color={activeTheme.accent} />
                </Pressable>
            </View>

            {locationWeather && (
                <View style={[styles.locationCard, { backgroundColor: activeTheme.card }]}>
                    <Ionicons name="location-outline" size={20} color={activeTheme.text} />
                    <Text style={[styles.locationCity, { color: activeTheme.text }]}>
                        {locationWeather.city}, {locationWeather.country}
                    </Text>
                    {locationLocalTime ? (
                        <Text style={[styles.locationTime, { color: activeTheme.subtleText }]}>{locationLocalTime}</Text>
                    ) : null}
                    <Text style={[styles.locationTemp, { color: tempColor(locationWeather.tempC) }]}>
                        {formatTemp(locationWeather.tempC, locationWeather.tempF, unit)}
                    </Text>
                    <Text style={[styles.locationFeelsLike, { color: activeTheme.text }]}>
                        Feels Like: {formatTemp(locationWeather.feelsLikeC, locationWeather.feelsLikeF, unit)}
                    </Text>

                    {locationSlots.length > 0 && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.slotsScroll}
                            contentContainerStyle={styles.slotsContent}
                        >
                            {locationSlots.map((slot) => (
                                <View key={slot.time} style={[styles.slotCard, { backgroundColor: activeTheme.background }]}>
                                    <Text style={[styles.slotTime, { color: activeTheme.subtleText }]}>
                                        {new Date(slot.time).toLocaleTimeString([], { hour: "numeric", hour12: true })}
                                    </Text>
                                    <Image
                                        source={{ uri: `https://openweathermap.org/img/wn/${slot.icon}.png` }}
                                        style={styles.slotIcon}
                                    />
                                    <Text style={[styles.slotTemp, { color: activeTheme.text }]}>
                                        {unit === "C" ? `${slot.tempC}°` : `${slot.tempF}°`}
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>
                    )}

                    <Pressable
                        style={[styles.forecastBtn, { backgroundColor: activeTheme.accent }]}
                        onPress={() => navigation.navigate("WeatherDetail", {
                            city: locationWeather.city,
                            background: activeTheme.background,
                        })}
                    >
                        <Text style={styles.forecastBtnText}>View Details</Text>
                    </Pressable>
                </View>
            )}

            <Modal
                visible={showInput}
                transparent
                animationType="slide"
                onRequestClose={closeModal}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <Pressable style={styles.modalBackdrop} onPress={closeModal} pointerEvents="box-only" />
                    <View style={[styles.modalSheet, { backgroundColor: activeTheme.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: activeTheme.text }]}>Add a City</Text>
                            <Pressable onPress={closeModal} hitSlop={8}>
                                <Ionicons name="close" size={24} color={activeTheme.text} />
                            </Pressable>
                        </View>
                        {status && (
                            <Text style={[styles.status, status.type === "error" ? styles.statusError : styles.statusSuccess]}>
                                {status.text}
                            </Text>
                        )}
                        <View style={styles.row}>
                            <TextInput
                                ref={inputRef}
                                style={[styles.input, { backgroundColor: activeTheme.card, color: activeTheme.text }]}
                                placeholder="Search city (e.g., Hong Kong)"
                                placeholderTextColor={activeTheme.subtleText}
                                value={newCity}
                                autoFocus
                                onChangeText={(t) => {
                                    setNewCity(t);
                                    setSelectedSuggestion(null);
                                    clearStatus();
                                    if (debounceRef.current) clearTimeout(debounceRef.current);
                                    const q = t.trim();
                                    if (q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
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
                            <FlatList
                                data={suggestions}
                                keyExtractor={(s) => `${s.lat},${s.lon}`}
                                style={[styles.suggestBox, { backgroundColor: activeTheme.card }]}
                                keyboardShouldPersistTaps="handled"
                                renderItem={({ item: s }) => (
                                    <Pressable
                                        style={styles.suggestRow}
                                        onPress={() => {
                                            setNewCity(s.label);
                                            setSelectedSuggestion(s);
                                            setShowSuggestions(false);
                                            setSuggestions([]);
                                        }}
                                    >
                                        <Text style={{ color: activeTheme.text, fontWeight: "700" }}>{s.label}</Text>
                                    </Pressable>
                                )}
                            />
                        )}
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <View style={styles.rowBetween}>
                <Text style={[styles.h2, { color: activeTheme.text }]}>Locations</Text>
                {!showInput && (
                    <Pressable onPress={() => setShowInput(true)}>
                        <Text style={[styles.link, { color: activeTheme.accent }]}>+ Add</Text>
                    </Pressable>
                )}
            </View>

            <FlatList
                data={cities}
                keyExtractor={(item) => item}
                contentContainerStyle={{ gap: 10, paddingVertical: 12 }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                    const w = weatherMap[item];
                    return (
                        <CityRow
                            city={item}
                            weather={w}
                            unit={unit}
                            cardColor={activeTheme.card}
                            textColor={activeTheme.text}
                            subtleTextColor={activeTheme.subtleText}
                            onOpen={() => navigation.navigate("WeatherDetail", { city: item, background: activeTheme.background })}
                            onRemove={() => removeCity(item)}
                        />
                    );
                }}
            />

        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    container: { flex: 1, paddingHorizontal: 16, paddingBottom: 16 },

    row: { flexDirection: "row", gap: 10 },
    rowBetween: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 6,
    },

    input: { flex: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
    addBtn: { paddingHorizontal: 16, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    addBtnText: { color: "white", fontWeight: "800" },
    h2: { fontSize: 16, fontWeight: "800" },
    link: { fontWeight: "800" },

    status: { marginTop: 10, textAlign: "center", fontWeight: "800" },
    statusError: { color: "#DC2626" },
    statusSuccess: { color: "#16A34A" },

    locationCard: {
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(128,128,128,0.25)",
    },
    locationCity: { fontSize: 15, fontWeight: "600", marginBottom: 2, textAlign: "center" },
    locationTime: { fontSize: 12, fontWeight: "500", opacity: 0.7, marginBottom: 2, textAlign: "center" },
    locationTemp: { fontSize: 72, fontWeight: "200", marginBottom: 2, textAlign: "center", letterSpacing: -2 },
    locationFeelsLike: { fontSize: 13, opacity: 0.7, textAlign: "center" },

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

    greetingRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    greeting: { fontSize: 22, fontWeight: "800" },

    slotsScroll: { marginTop: 12, width: "100%" },
    slotsContent: { gap: 8, paddingHorizontal: 2 },
    slotCard: {
        alignItems: "center",
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        minWidth: 60,
    },
    slotTime: { fontSize: 11, fontWeight: "600" },
    slotIcon: { width: 36, height: 36 },
    slotTemp: { fontSize: 13, fontWeight: "800" },

    forecastBtn: {
        marginTop: 12,
        width: "100%",
        padding: 10,
        borderRadius: 12,
        alignItems: "center",
    },
    forecastBtnText: { color: "white", fontWeight: "800", fontSize: 13 },

    modalOverlay: { flex: 1, justifyContent: "flex-end" },
    modalBackdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
    modalSheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 36,
        gap: 12,
        flex: 1,
        marginTop: 60,
    },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
});