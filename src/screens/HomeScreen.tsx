import React, { useEffect, useMemo, useState, useCallback } from "react";
import ThemeBackground from "../components/ThemeBackground";
import AddCityModal from "../components/AddCityModal";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchCurrentWeather, fetchCurrentWeatherByCoords } from "../services/openWeather";
import { CurrentWeather, WeatherCondition } from "../types/weather";
import { tempColor } from "../utils/tempColor";
import { formatTemp } from "../utils/format";
import { useLocalTime } from "../hooks/useLocalTime";
import { useLocationWeather } from "../hooks/useLocationWeather";
import { themeForCondition, isNightTime } from "../theme/weatherTheme";
import CityRow from "../components/CityRow";
import { getCities, deleteCity, CityEntry } from "../services/cities";
import { loadSettings, HomeThemeMode } from "../storage/settings";
import { useStatusMessage } from "../hooks/useStatusMessage";
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    FlatList,
    ScrollView,
    Image,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from "react-native";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

async function fetchWeatherForCities(cities: CityEntry[]): Promise<Record<string, CurrentWeather>> {
    const results = await Promise.allSettled(
        cities.map((c) =>
            c.lat != null && c.lon != null
                ? fetchCurrentWeatherByCoords(c.lat, c.lon)
                : fetchCurrentWeather(c.city)
        )
    );
    const entries: Array<[string, CurrentWeather]> = [];
    results.forEach((result, i) => {
        if (result.status === "fulfilled") entries.push([cities[i].city, result.value]);
        else console.warn("Weather fetch failed for", cities[i].city, result.reason);
    });
    return Object.fromEntries(entries);
}

function getGreeting(): string {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Good Morning";
    if (h >= 12 && h < 17) return "Good Afternoon";
    if (h >= 17 && h < 21) return "Good Evening";
    return "Good Night";
}

export default function HomeScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const [cities, setCities] = useState<CityEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [weatherMap, setWeatherMap] = useState<Record<string, CurrentWeather>>({});
    const [unit, setUnit] = useState<"C" | "F">("C");
    const [homeTheme, setHomeTheme] = useState<HomeThemeMode>("top");
    const [fixedTheme, setFixedTheme] = useState("Clouds");
    const [showModal, setShowModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const { status, showError, showSuccess } = useStatusMessage();

    const { locationWeather, locationSlots } = useLocationWeather();
    const locationLocalTime = useLocalTime(locationWeather?.timezone);

    const { activeTheme, locationCondition, locationIsNight, topCondition, topIsNight } = useMemo(() => {
        let condition: WeatherCondition;
        let sourceWeather: typeof locationWeather | undefined;
        if (homeTheme === "location") {
            condition = locationWeather?.condition ?? "Clouds";
            sourceWeather = locationWeather;
        } else if (homeTheme === "fixed") {
            condition = fixedTheme as WeatherCondition;
        } else {
            const first = cities.length > 0 ? weatherMap[cities[0].city] : undefined;
            condition = first?.condition ?? "Clouds";
            sourceWeather = first;
        }
        const nightFor = (w?: CurrentWeather | null) => isNightTime(w?.sunrise ?? null, w?.sunset ?? null);
        const topWeather = cities.length > 0 ? weatherMap[cities[0].city] : undefined;
        return {
            activeTheme: themeForCondition(condition, nightFor(sourceWeather)),
            locationCondition: locationWeather?.condition ?? "Clouds",
            locationIsNight: nightFor(locationWeather),
            topCondition: topWeather?.condition ?? "Clouds",
            topIsNight: nightFor(topWeather),
        };
    }, [cities, weatherMap, locationWeather, homeTheme, fixedTheme]);

    useFocusEffect(
        useCallback(() => {
            loadSettings().then((s) => {
                setUnit(s.unit);
                setHomeTheme(s.homeTheme);
                setFixedTheme(s.fixedTheme);
            });
        }, [])
    );

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
            setCities(data ?? []);
            setLoading(false);
        })();
    }, []);

    useEffect(() => {
        fetchWeatherForCities(cities).then(setWeatherMap);
    }, [cities]);

    const refreshWeather = useCallback(async () => {
        setRefreshing(true);
        setWeatherMap(await fetchWeatherForCities(cities));
        setRefreshing(false);
    }, [cities]);

    const removeCity = async (city: string) => {
        const { error } = await deleteCity(city);
        if (error) {
            console.warn(error);
            Alert.alert("Database error", "Couldn't remove that city.");
            showError("Couldn't remove that city.");
            return;
        }
        setCities((prev) => prev.filter((c) => c.city !== city));
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

            {/* Header */}
            <View style={styles.greetingRow}>
                <Text style={[styles.greeting, { color: activeTheme.text }]}>{getGreeting()}</Text>
                <Pressable onPress={() => navigation.navigate("Settings", { locationCondition, locationIsNight, topCondition, topIsNight })} hitSlop={8}>
                    <Ionicons name="settings-outline" size={22} color={activeTheme.accent} />
                </Pressable>
            </View>

            {status && (
                <View style={[styles.statusPill, status.type === "error" ? styles.statusPillError : styles.statusPillSuccess]}>
                    <Text style={[styles.statusText, status.type === "error" ? styles.statusTextError : styles.statusTextSuccess]}>
                        {status.text}
                    </Text>
                </View>
            )}

            {/* Location card */}
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
                                        {formatTemp(slot.tempC, slot.tempF, unit)}
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

            <AddCityModal
                visible={showModal}
                cities={cities.map((c) => c.city)}
                theme={activeTheme}
                onClose={() => setShowModal(false)}
                onCityAdded={(entry) => {
                    setCities((prev) => [entry, ...prev]);
                    showSuccess(`Added ${entry.city}.`);
                }}
            />

            {/* City list */}
            <View style={styles.rowBetween}>
                <Text style={[styles.h2, { color: activeTheme.text }]}>Locations</Text>
                <Pressable onPress={() => setShowModal(true)}>
                    <Text style={[styles.link, { color: activeTheme.accent }]}>+ Add</Text>
                </Pressable>
            </View>

            <FlatList
                data={cities}
                keyExtractor={(item) => item.city}
                contentContainerStyle={{ gap: 10, paddingVertical: 12 }}
                refreshing={refreshing}
                onRefresh={refreshWeather}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                    <CityRow
                        city={item.city}
                        weather={weatherMap[item.city]}
                        unit={unit}
                        cardColor={activeTheme.card}
                        textColor={activeTheme.text}
                        subtleTextColor={activeTheme.subtleText}
                        onOpen={() => navigation.navigate("WeatherDetail", {
                            city: item.city,
                            background: activeTheme.background,
                            lat: item.lat ?? undefined,
                            lon: item.lon ?? undefined,
                        })}
                        onRemove={() => removeCity(item.city)}
                    />
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    container: { flex: 1, paddingHorizontal: 16, paddingBottom: 16 },

    rowBetween: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 6,
        paddingBottom: 5,
    },

    h2: { fontSize: 16, fontWeight: "800" },
    link: { fontWeight: "800" },

    statusPill: {
        alignSelf: "center",
        marginTop: 10,
        marginBottom: 6,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 999,
    },
    statusPillError: { backgroundColor: "rgba(220,38,38,0.12)" },
    statusPillSuccess: { backgroundColor: "rgba(22,163,74,0.12)" },
    statusText: { fontSize: 13, fontWeight: "700", textAlign: "center" },
    statusTextError: { color: "#DC2626" },
    statusTextSuccess: { color: "#16A34A" },

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
    locationTemp: { fontSize: 60, fontWeight: "500", marginBottom: 2, textAlign: "center", letterSpacing: -2 },
    locationFeelsLike: { fontSize: 13, opacity: 0.7, textAlign: "center" },

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
