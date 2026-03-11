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
import { themeForCondition } from "../theme/weatherTheme";
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
        const t = setTimeout(clearStatus, 3000);
        return () => clearTimeout(t);
    }, [status]);

    // Current location weather
    const [locationWeather, setLocationWeather] = useState<CurrentWeather | null>(null);
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

    // Autocomplete suggestions
    const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

    // Derive active condition + theme based on homeTheme setting
    const { activeTheme, activeCondition } = useMemo(() => {
        let condition: string;
        if (homeTheme === "location") {
            condition = locationWeather?.condition ?? "Clouds";
        } else if (homeTheme === "fixed") {
            condition = fixedTheme;
        } else {
            const first = cities.length > 0 ? weatherMap[cities[0]] : undefined;
            condition = first?.condition ?? "Clouds";
        }
        return { activeTheme: themeForCondition(condition as any), activeCondition: condition };
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

        const { error } = await insertCity(city);

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
        setShowInput(false);
        showSuccess(`Added ${city}.`);
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
                <Pressable onPress={() => navigation.navigate("Settings", { condition: activeCondition })} hitSlop={8}>
                    <Ionicons name="settings-outline" size={22} color={activeTheme.accent} />
                </Pressable>
            </View>

            {locationWeather && (
                <View style={[styles.locationCard, { backgroundColor: activeTheme.card }]}>
                    <Ionicons name="location-outline" size={20} color={activeTheme.text} />
                    <Text style={[styles.locationCity, { color: activeTheme.text }]}>
                        {locationWeather.city}, {locationWeather.country}
                    </Text>
                    <Text style={[styles.locationTemp, { color: tempColor(locationWeather.tempC) }]}>
                        {formatTemp(locationWeather.tempC, locationWeather.tempF, unit)}
                    </Text>
                    <Text style={[styles.locationFeelsLike, { color: activeTheme.text }]}>
                        Feels Like: {formatTemp(locationWeather.feelsLikeC, locationWeather.feelsLikeF, unit)}
                    </Text>
                    <Text style={[styles.locationFeelsLike, { color: activeTheme.text }]}>
                        H: {locationWeather.humidity}%{"   "}W: {locationWeather.windSpeed} m/s
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
                        onPress={() => navigation.navigate("Forecast", {
                            city: locationWeather.city,
                            condition: locationWeather.condition,
                        })}
                    >
                        <Text style={styles.forecastBtnText}>5-Day Forecast</Text>
                    </Pressable>
                </View>
            )}

            {showInput && (
                <View style={styles.row}>
                    <TextInput
                        ref={inputRef}
                        style={[styles.input, { backgroundColor: activeTheme.card }]}
                        placeholder="Add a city (e.g., London)"
                        value={newCity}
                        autoFocus
                        onBlur={() => { if (!newCity.trim()) setShowInput(false); }}
                        onChangeText={(t) => {
                            setNewCity(t);
                            clearStatus();

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
            )}

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
                renderItem={({ item }) => (
                    <CityRow
                        city={item}
                        weather={weatherMap[item]}
                        unit={unit}
                        cardColor={activeTheme.card}
                        textColor={activeTheme.text}
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
    container: { flex: 1, paddingHorizontal: 16, paddingBottom: 16 },

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
        alignItems: "center",
    },
    locationCity: { fontSize: 15, fontWeight: "600", marginBottom: 2, textAlign: "center" },
    locationTemp: { fontSize: 48, fontWeight: "800", marginBottom: 2, textAlign: "center" },
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
});