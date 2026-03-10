import React, { useCallback, useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Image,
    Pressable,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../navigation/types";
import { fetchForecast } from "../services/openWeather";
import { ForecastDay, WeatherCondition } from "../types/weather";
import { themeForCondition } from "../theme/weatherTheme";
import { loadSettings } from "../storage/settings";
import ThemeBackground from "../components/ThemeBackground";

type Props = NativeStackScreenProps<RootStackParamList, "Forecast">;

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ForecastScreen({ route, navigation }: Props) {
    const insets = useSafeAreaInsets();
    const { city, condition } = route.params;
    const [days, setDays] = useState<ForecastDay[]>([]);
    const [unit, setUnit] = useState<"C" | "F">("C");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const theme = themeForCondition(condition as WeatherCondition);

    useFocusEffect(
        useCallback(() => {
            loadSettings().then((s) => setUnit(s.unit));
        }, [])
    );

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError(false);
            try {
                const forecast = await fetchForecast(city);
                setDays(forecast);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        })();
    }, [city]);

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

            <View style={[styles.header, { paddingTop: insets.top + 52 }]}>
                <Text style={[styles.city, { color: theme.text }]}>{city}</Text>
                <Text style={[styles.subtitle, { color: theme.subtleText }]}>5-Day Forecast</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={theme.accent} />
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text style={{ color: theme.text }}>Failed to load forecast.</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                >
                    {days.map((day) => {
                        const dayName = DAY_NAMES[new Date(day.date).getDay()];
                        const dateStr = new Date(day.date).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                        });
                        const minTemp =
                            unit === "C" ? `${day.minTempC}°C` : `${day.minTempF}°F`;
                        const maxTemp =
                            unit === "C" ? `${day.maxTempC}°C` : `${day.maxTempF}°F`;
                        const iconUrl = `https://openweathermap.org/img/wn/${day.icon}@2x.png`;

                        return (
                            <View
                                key={day.date}
                                style={[styles.card, { backgroundColor: theme.card }]}
                            >
                                <View style={styles.dayCol}>
                                    <Text style={[styles.dayName, { color: theme.text }]}>
                                        {dayName}
                                    </Text>
                                    <Text style={[styles.dateStr, { color: theme.subtleText }]}>
                                        {dateStr}
                                    </Text>
                                </View>

                                <View style={styles.iconCol}>
                                    <Image source={{ uri: iconUrl }} style={styles.icon} />
                                    <Text style={[styles.desc, { color: theme.subtleText }]}>
                                        {day.description}
                                    </Text>
                                </View>

                                <View style={styles.tempCol}>
                                    <Text style={[styles.maxTemp, { color: theme.text }]}>
                                        {maxTemp}
                                    </Text>
                                    <Text style={[styles.minTemp, { color: theme.subtleText }]}>
                                        {minTemp}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    backBtn: { position: "absolute", left: 12, zIndex: 10, padding: 4 },
    header: { marginBottom: 20 },
    city: { fontSize: 26, fontWeight: "900" },
    subtitle: { fontSize: 14, fontWeight: "600", marginTop: 2 },
    list: { gap: 12, paddingBottom: 32 },
    card: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        padding: 14,
    },
    dayCol: { width: 56 },
    dayName: { fontSize: 16, fontWeight: "800" },
    dateStr: { fontSize: 12, marginTop: 2 },
    iconCol: { flex: 1, alignItems: "center" },
    icon: { width: 44, height: 44 },
    desc: { fontSize: 11, textAlign: "center", marginTop: 2 },
    tempCol: { width: 64, alignItems: "flex-end" },
    maxTemp: { fontSize: 18, fontWeight: "800" },
    minTemp: { fontSize: 14, fontWeight: "600", marginTop: 2 },
});
