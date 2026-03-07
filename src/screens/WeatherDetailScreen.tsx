import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Image, Pressable } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { fetchCurrentWeather } from "../services/openWeather";
import { CurrentWeather } from "../types/weather";
import { themeForCondition } from "../theme/weatherTheme";
import { loadSettings } from "../storage/settings";
import ThemeBackground from "../components/ThemeBackground";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<RootStackParamList, "WeatherDetail">;

export default function WeatherDetailScreen({ route, navigation }: Props) {
    const insets = useSafeAreaInsets();
    const { city } = route.params;

    // Current weather data for this city
    const [weather, setWeather] = useState<CurrentWeather | null>(null);

    // Temperature unit preference (C or F), loaded from Settings
    const [unit, setUnit] = useState<"C" | "F">("C");

    // Loading state for the weather request
    const [loading, setLoading] = useState(true);

    //Loads weather for the current city when screen loads or "Retry" tapped.
    const loadWeather = async () => {
        setLoading(true);
        try {
            const w = await fetchCurrentWeather(city);
            setWeather(w);
        } catch {
            // If the request fails (network, API error, etc.), show the failure UI
            setWeather(null);
        } finally {
            setLoading(false);
        }
    };

    // Load user settings (unit) once when the screen mounts
    useEffect(() => {
        (async () => {
            const s = await loadSettings();
            setUnit(s.unit);
        })();
    }, []);

    // Fetch weather whenever the city changes (including first mount)
    useEffect(() => {
        loadWeather();
    }, [city]);

    // Decide colors for the screen based on the weather condition
    const theme = useMemo(() => {
        return themeForCondition(weather?.condition ?? "Clouds");
    }, [weather]);

    // Loading UI while fetching
    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: "#fff" }]}>
                <ActivityIndicator />
            </View>
        );
    }

    // Failure UI when the weather request fails
    // The Retry button calls loadWeather() again to re-attempt the request.
    if (!weather) {
        return (
            <View style={[styles.center, { padding: 16 }]}>
                <Text>Failed to load weather.</Text>

                <Pressable style={styles.retryBtn} onPress={loadWeather}>
                    <Text style={styles.retryText}>Retry</Text>
                </Pressable>
            </View>
        );
    }

    // Display temperature in user's chosen unit
    const temp = unit === "C" ? `${weather.tempC}°C` : `${weather.tempF}°F`;

    const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ThemeBackground theme={theme} />

            <Pressable
                style={[styles.backBtn, { top: insets.top + 12 }]}
                onPress={() => navigation.goBack()}
                hitSlop={8}
            >
                <Ionicons name="chevron-back" size={26} color={theme.accent} />
            </Pressable>

            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.title, { color: theme.text }]}>
                    {weather.city}, {weather.country}
                </Text>

                <View style={styles.centerRow}>
                    <Image source={{ uri: iconUrl }} style={{ width: 64, height: 64 }} />
                    <Text style={[styles.temp, { color: theme.text }]}>{temp}</Text>
                </View>

                <Text style={[styles.description, { color: theme.subtleText }]}>{weather.description}</Text>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: theme.subtleText }]}>Feels Like</Text>
                        <Text style={[styles.statValue, { color: theme.text }]}>
                            {unit === "C" ? `${weather.feelsLikeC}°C` : `${weather.feelsLikeF}°F`}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: theme.subtleText }]}>Humidity</Text>
                        <Text style={[styles.statValue, { color: theme.text }]}>{weather.humidity}%</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: theme.subtleText }]}>Wind</Text>
                        <Text style={[styles.statValue, { color: theme.text }]}>{weather.windSpeed} m/s</Text>
                    </View>
                </View>

                <Text style={{ marginTop: 10, color: theme.subtleText, fontSize: 11, textAlign: "center" }}>
                    Updated: {new Date(weather.updatedAt).toLocaleString()}
                </Text>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    container: { flex: 1, padding: 16, justifyContent: "center" },
    card: { borderRadius: 18, padding: 16 },
    title: { fontSize: 22, fontWeight: "900", textAlign: "center" },
    row: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
    temp: { fontSize: 38, fontWeight: "900" },
    settingsBtn: { marginTop: 14, padding: 12, borderRadius: 12 },
    retryBtn: { marginTop: 12, backgroundColor: "#111827", padding: 12, borderRadius: 12 },
    retryText: { color: "white", fontWeight: "800" },
    backBtn: { position: "absolute", left: 12, zIndex: 10, padding: 4 },
    centerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10 },
    description: { textAlign: "center", marginTop: 4, fontSize: 14 },
    statsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
    statItem: { flex: 1, alignItems: "center" },
    statLabel: { fontSize: 11, fontWeight: "600", opacity: 0.7, marginBottom: 2 },
    statValue: { fontSize: 15, fontWeight: "800" },
});