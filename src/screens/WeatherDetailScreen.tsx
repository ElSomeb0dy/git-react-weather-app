import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Image, Pressable } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { fetchCurrentWeather } from "../services/openWeather";
import { CurrentWeather } from "../types/weather";
import { themeForCondition } from "../theme/weatherTheme";
import { loadSettings } from "../storage/settings";

type Props = NativeStackScreenProps<RootStackParamList, "WeatherDetail">;

export default function WeatherDetailScreen({ route, navigation }: Props) {
    // City name passed from Home screen via navigation params
    const { city } = route.params;

    // Current weather data for this city
    const [weather, setWeather] = useState<CurrentWeather | null>(null);

    // Temperature unit preference (C or F), loaded from Settings
    const [unit, setUnit] = useState<"C" | "F">("C");

    // Loading state for the weather request
    const [loading, setLoading] = useState(true);

    /**
     * Loads weather for the current city.
     * Used both when the screen loads and when the user taps "Retry".
     */
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

    // OpenWeather icon URL
    const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.title, { color: theme.text }]}>
                    {weather.city}, {weather.country}
                </Text>

                <View style={styles.row}>
                    <Image source={{ uri: iconUrl }} style={{ width: 80, height: 80 }} />
                    <View>
                        <Text style={[styles.temp, { color: theme.text }]}>{temp}</Text>
                        <Text style={{ color: theme.subtleText }}>{weather.description}</Text>
                        <Text style={{ color: theme.subtleText }}>
                            Humidity: {weather.humidity}% • Wind: {weather.windSpeed} m/s
                        </Text>
                    </View>
                </View>

                <Text style={{ marginTop: 10, color: theme.subtleText }}>
                    Updated: {new Date(weather.updatedAt).toLocaleString()}
                </Text>

                <Pressable
                    style={[styles.settingsBtn, { backgroundColor: theme.accent }]}
                    onPress={() => navigation.navigate("Settings")}
                >
                    <Text style={{ color: "white", fontWeight: "800", textAlign: "center" }}>
                        Settings
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    container: { flex: 1, padding: 16, justifyContent: "center" },
    card: { borderRadius: 18, padding: 16 },
    title: { fontSize: 22, fontWeight: "900" },
    row: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
    temp: { fontSize: 38, fontWeight: "900" },
    settingsBtn: { marginTop: 14, padding: 12, borderRadius: 12 },

    // Styles for the Retry button shown in the failure state
    retryBtn: { marginTop: 12, backgroundColor: "#111827", padding: 12, borderRadius: 12 },
    retryText: { color: "white", fontWeight: "800" },
});