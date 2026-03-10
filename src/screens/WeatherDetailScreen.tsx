import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Image, Pressable } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";
import { fetchCurrentWeather } from "../services/openWeather";
import { formatTemp, weatherIconUrl } from "../utils/format";
import { CurrentWeather } from "../types/weather";
import { themeForCondition } from "../theme/weatherTheme";
import { loadSettings } from "../storage/settings";
import ThemeBackground from "../components/ThemeBackground";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<RootStackParamList, "WeatherDetail">;

const formatTime = (value: number | null) =>
    value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--";

export default function WeatherDetailScreen({ route, navigation }: Props) {
    const insets = useSafeAreaInsets();
    const { city } = route.params;
    const [weather, setWeather] = useState<CurrentWeather | null>(null);
    const [unit, setUnit] = useState<"C" | "F">("C");
    const [loading, setLoading] = useState(true);

    const loadWeather = async () => {
        setLoading(true);
        try {
            const w = await fetchCurrentWeather(city);
            setWeather(w);
        } catch {
            setWeather(null);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadSettings()
                .then((s) => setUnit(s.unit))
                .catch(() => {});
        }, [])
    );

    useEffect(() => {
        loadWeather();
    }, [city]);

    const theme = useMemo(() => {
        return themeForCondition(weather?.condition ?? "Clouds");
    }, [weather]);

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: "#fff" }]}>
                <ActivityIndicator />
            </View>
        );
    }

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

    const temp = formatTemp(weather.tempC, weather.tempF, unit);
    const feelsLike = formatTemp(weather.feelsLikeC, weather.feelsLikeF, unit);
    const minTemp = formatTemp(weather.minTempC, weather.minTempF, unit);
    const maxTemp = formatTemp(weather.maxTempC, weather.maxTempF, unit);

    const iconUrl = weatherIconUrl(weather.icon);

    const visibilityKm = (weather.visibility / 1000).toFixed(1);

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

            <View style={styles.content}>
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <Text style={[styles.title, { color: theme.text }]}>
                        {weather.city}, {weather.country}
                    </Text>

                    <View style={styles.centerRow}>
                        <Image source={{ uri: iconUrl }} style={styles.icon} />
                        <Text style={[styles.temp, { color: theme.text }]}>{temp}</Text>
                    </View>

                    <Text style={[styles.description, { color: theme.subtleText }]}>
                        {weather.description}
                    </Text>

                    <Pressable
                        style={[styles.forecastBtn, { backgroundColor: theme.accent }]}
                        onPress={() =>
                            navigation.navigate("Forecast", {
                                city: weather.city,
                                condition: weather.condition,
                            })
                        }
                    >
                        <Text style={styles.forecastBtnText}>5-Day Forecast</Text>
                    </Pressable>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statLabel, { color: theme.subtleText }]}>Feels Like</Text>
                            <Text style={[styles.statValue, { color: theme.text }]}>{feelsLike}</Text>
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

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statLabel, { color: theme.subtleText }]}>Min</Text>
                            <Text style={[styles.statValue, { color: theme.text }]}>{minTemp}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statLabel, { color: theme.subtleText }]}>Max</Text>
                            <Text style={[styles.statValue, { color: theme.text }]}>{maxTemp}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statLabel, { color: theme.subtleText }]}>Pressure</Text>
                            <Text style={[styles.statValue, { color: theme.text }]}>{weather.pressure} hPa</Text>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statLabel, { color: theme.subtleText }]}>Visibility</Text>
                            <Text style={[styles.statValue, { color: theme.text }]}>{visibilityKm} km</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statLabel, { color: theme.subtleText }]}>Sunrise</Text>
                            <Text style={[styles.statValue, { color: theme.text }]}>{formatTime(weather.sunrise)}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statLabel, { color: theme.subtleText }]}>Sunset</Text>
                            <Text style={[styles.statValue, { color: theme.text }]}>{formatTime(weather.sunset)}</Text>
                        </View>
                    </View>

                    <Text style={[styles.updatedText, { color: theme.subtleText }]}>
                        Updated: {new Date(weather.updatedAt).toLocaleString()}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    container: { flex: 1, padding: 16 },

    content: {
        flex: 1,
        justifyContent: "center",
    },

    card: {
        borderRadius: 18,
        padding: 18,
        marginHorizontal: 4,
    },

    title: { fontSize: 22, fontWeight: "900", textAlign: "center" },
    temp: { fontSize: 38, fontWeight: "900" },

    retryBtn: { marginTop: 12, backgroundColor: "#111827", padding: 12, borderRadius: 12 },
    retryText: { color: "white", fontWeight: "800" },

    backBtn: { position: "absolute", left: 12, zIndex: 10, padding: 4 },

    centerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 10,
    },

    description: { textAlign: "center", marginTop: 4, fontSize: 14 },

    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 18,
    },

    statItem: { flex: 1, alignItems: "center" },
    statLabel: { fontSize: 11, fontWeight: "600", opacity: 0.7, marginBottom: 2 },
    statValue: { fontSize: 15, fontWeight: "800", textAlign: "center" },

    updatedText: {
        marginTop: 18,
        fontSize: 11,
        textAlign: "center",
    },
    forecastBtn: {
        marginTop: 16,
        padding: 12,
        borderRadius: 12,
        alignItems: "center",
    },
    forecastBtnText: { color: "white", fontWeight: "800", fontSize: 14 },
    icon: { width: 64, height: 64 },
});