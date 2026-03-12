import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Image, Pressable, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";
import { fetchCurrentWeather, fetchForecast } from "../services/openWeather";
import { formatTemp } from "../utils/format";
import { useLocalTime } from "../utils/useLocalTime";
import { CurrentWeather, ForecastDay } from "../types/weather";
import { themeForCondition, isNightTime } from "../theme/weatherTheme";
import { loadSettings } from "../storage/settings";
import ThemeBackground from "../components/ThemeBackground";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<RootStackParamList, "WeatherDetail">;

const formatTime = (value: number | null) =>
    value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function WeatherDetailScreen({ route, navigation }: Props) {
    const insets = useSafeAreaInsets();
    const { city } = route.params;
    const [weather, setWeather] = useState<CurrentWeather | null>(null);
    const [forecast, setForecast] = useState<ForecastDay[]>([]);
    const [unit, setUnit] = useState<"C" | "F">("C");
    const [loading, setLoading] = useState(true);

    const loadWeather = async () => {
        setLoading(true);
        try {
            const [w, f] = await Promise.all([fetchCurrentWeather(city), fetchForecast(city)]);
            setWeather(w);
            setForecast(f.slice(0, 5));
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

    const localTime = useLocalTime(weather?.timezone);

    const theme = useMemo(() => {
        const night = isNightTime(weather?.sunrise ?? null, weather?.sunset ?? null);
        return themeForCondition(weather?.condition ?? "Clouds", night);
    }, [weather]);

    if (loading) {
        const bg = route.params.background ?? "#fff";
        const isDark = route.params.background != null;
        const subtleCol = isDark ? "rgba(255,255,255,0.5)" : "#6B7280";
        return (
            <View style={[styles.center, { backgroundColor: bg }]}>
                <ActivityIndicator color={isDark ? "#fff" : "#000"} />
                <Text style={[styles.loadingLabel, { color: subtleCol }]}>Fetching data…</Text>
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
    const visibilityKm = (weather.visibility / 1000).toFixed(1);

    const STATS = [
        { label: "Feels Like", value: feelsLike },
        { label: "Humidity",   value: `${weather.humidity}%` },
        { label: "Wind",       value: `${weather.windSpeed} m/s` },
        { label: "Min",        value: minTemp },
        { label: "Max",        value: maxTemp },
        { label: "Pressure",   value: `${weather.pressure} hPa` },
        { label: "Visibility", value: `${visibilityKm} km` },
        { label: "Sunrise",    value: formatTime(weather.sunrise) },
        { label: "Sunset",     value: formatTime(weather.sunset) },
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ThemeBackground theme={theme} />

            <Pressable
                style={[styles.backBtn, { top: insets.top + 12 }]}
                onPress={() => navigation.goBack()}
                hitSlop={8}
            >
                <Ionicons name="chevron-back" size={26} color={theme.text} />
            </Pressable>

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 52 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero — floats on background */}
                <View style={styles.hero}>
                    <Text style={[styles.cityName, { color: theme.text }]}>
                        {weather.city}, {weather.country}
                    </Text>
                    <Text style={[styles.heroTemp, { color: theme.text }]}>{temp}</Text>
                    <Text style={[styles.heroDesc, { color: theme.subtleText }]}>
                        {weather.description}
                    </Text>
                    {localTime ? (
                        <Text style={[styles.heroTime, { color: theme.subtleText }]}>{localTime}</Text>
                    ) : null}
                </View>

                {/* Stats card */}
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <Text style={[styles.cardLabel, { color: theme.subtleText }]}>Details</Text>
                    <View style={styles.statsGrid}>
                        {STATS.map((s) => (
                            <View key={s.label} style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: theme.subtleText }]}>{s.label}</Text>
                                <Text style={[styles.statValue, { color: theme.text }]}>{s.value}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Forecast card */}
                {forecast.length > 0 && (
                    <View style={[styles.card, { backgroundColor: theme.card }]}>
                        <Text style={[styles.cardLabel, { color: theme.subtleText }]}>5-Day Forecast</Text>
                        {forecast.map((day, i) => {
                            const dayName = DAY_NAMES[new Date(day.date).getDay()];
                            const dateStr = new Date(day.date).toLocaleDateString([], { month: "short", day: "numeric" });
                            const minT = formatTemp(day.minTempC, day.minTempF, unit);
                            const maxT = formatTemp(day.maxTempC, day.maxTempF, unit);
                            return (
                                <View
                                    key={day.date}
                                    style={[
                                        styles.forecastRow,
                                        i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.subtleText },
                                    ]}
                                >
                                    <View style={styles.dayCol}>
                                        <Text style={[styles.dayName, { color: theme.text }]}>{dayName}</Text>
                                        <Text style={[styles.dateStr, { color: theme.subtleText }]}>{dateStr}</Text>
                                    </View>
                                    <View style={styles.iconCol}>
                                        <Image
                                            source={{ uri: `https://openweathermap.org/img/wn/${day.icon}@2x.png` }}
                                            style={styles.forecastIcon}
                                        />
                                        <Text style={[styles.forecastDesc, { color: theme.subtleText }]}>
                                            {day.description}
                                        </Text>
                                    </View>
                                    <View style={styles.tempCol}>
                                        <Text style={[styles.maxTemp, { color: theme.text }]}>{maxT}</Text>
                                        <Text style={[styles.minTemp, { color: theme.subtleText }]}>{minT}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                <Text style={[styles.updatedText, { color: theme.subtleText }]}>
                    Updated: {new Date(weather.updatedAt).toLocaleString()}
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    container: { flex: 1 },
    backBtn: { position: "absolute", left: 12, zIndex: 10, padding: 4 },
    retryBtn: { marginTop: 12, backgroundColor: "#111827", padding: 12, borderRadius: 12 },
    retryText: { color: "white", fontWeight: "800" },

    scroll: { padding: 16, gap: 14, paddingBottom: 36 },

    // Hero
    hero: { alignItems: "center", paddingVertical: 20 },
    cityName: { fontSize: 20, fontWeight: "700", opacity: 0.85 },
    heroTemp: { fontSize: 72, fontWeight: "500", marginTop: 4, letterSpacing: -2 },
    heroDesc: { fontSize: 16, fontWeight: "500", textTransform: "capitalize" },
    heroHL: { fontSize: 14, fontWeight: "600", marginTop: 6, opacity: 0.8 },
    heroTime: { fontSize: 13, fontWeight: "500", marginTop: 4, opacity: 0.7 },

    // Cards
    card: { borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "rgba(128,128,128,0.25)" },
    cardLabel: {
        fontSize: 11,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 12,
    },

    // Forecast rows
    forecastRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
    dayCol: { width: 52 },
    dayName: { fontSize: 15, fontWeight: "800" },
    dateStr: { fontSize: 11, marginTop: 2 },
    iconCol: { flex: 1, alignItems: "center" },
    forecastIcon: { width: 40, height: 40 },
    forecastDesc: { fontSize: 11, textAlign: "center", marginTop: 2 },
    tempCol: { width: 52, alignItems: "flex-end" },
    maxTemp: { fontSize: 16, fontWeight: "800" },
    minTemp: { fontSize: 13, fontWeight: "600", marginTop: 2 },

    // Stats grid
    statsGrid: { flexDirection: "row", flexWrap: "wrap" },
    statItem: { width: "33.33%", alignItems: "center", paddingVertical: 10 },
    statLabel: { fontSize: 11, fontWeight: "600", opacity: 0.7, marginBottom: 4 },
    statValue: { fontSize: 15, fontWeight: "800", textAlign: "center" },

    updatedText: { fontSize: 11, textAlign: "center", opacity: 0.6 },

    loadingLabel: { fontSize: 13, fontWeight: "500", marginTop: 10, textAlign: "center" },
});
