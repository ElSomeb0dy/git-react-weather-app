import React, { useEffect, useMemo, useState } from "react";
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

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { loadCities, saveCities } from "../storage/cities";
import { fetchCurrentWeather } from "../services/openWeather";
import { CurrentWeather } from "../types/weather";
import { themeForCondition } from "../theme/weatherTheme";
import CityRow from "../components/CityRow";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
    // List of saved city names (persisted in AsyncStorage)
    const [cities, setCities] = useState<string[]>([]);

    // Input for the "Add city" text box
    const [newCity, setNewCity] = useState("");

    // Simple loading state while we load initial data
    const [loading, setLoading] = useState(true);

    // Map city -> latest fetched weather for that city
    // Example: { "Paris": { tempC: 10, condition: "Clouds", ... } }
    const [weatherMap, setWeatherMap] = useState<Record<string, CurrentWeather>>({});

    // Decide the overall screen theme.
    // We use the first city's condition as the "global theme" for the screen.
    const activeTheme = useMemo(() => {
        const first = cities[0] && weatherMap[cities[0]];
        return first ? themeForCondition(first.condition) : themeForCondition("Clouds");
    }, [cities, weatherMap]);

    // On mount: load saved cities from storage
    useEffect(() => {
        (async () => {
            const loaded = await loadCities();
            setCities(loaded);
            setLoading(false);
        })();
    }, []);

    // Whenever the city list changes: fetch current weather for all cities.
    // Simple approach: sequential fetch
    useEffect(() => {
        (async () => {
            const entries: Array<[string, CurrentWeather]> = [];
            for (const c of cities) {
                try {
                    const w = await fetchCurrentWeather(c);
                    entries.push([c, w]);
                } catch (e) {
                    // If one city fails, we continue fetching the rest
                    console.warn("Weather fetch failed for", c, e);
                }
            }
            setWeatherMap(Object.fromEntries(entries));
        })();
    }, [cities]);

    // Add a city:
    // - trim input
    // - prevent duplicates
    // - validate by calling the API once
    // - persist updated list
    const addCity = async () => {
        const trimmed = newCity.trim();
        if (!trimmed) return;

        if (cities.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
            Alert.alert("Already added", "That city is already in your list.");
            return;
        }

        try {
            // Validate city exists by fetching once
            await fetchCurrentWeather(trimmed);
        } catch {
            Alert.alert("City not found", "OpenWeatherMap couldn't find that city.");
            return;
        }

        const updated = [trimmed, ...cities];
        setCities(updated);
        setNewCity("");
        await saveCities(updated);
    };

    // Remove a city and persist
    const removeCity = async (city: string) => {
        const updated = cities.filter((c) => c !== city);
        setCities(updated);
        await saveCities(updated);
    };

    // Basic loading UI
    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: "#fff" }]}>
                <ActivityIndicator />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.background }]}>
            {/* Add city input + button */}
            <View style={styles.row}>
                <TextInput
                    style={[styles.input, { backgroundColor: activeTheme.card }]}
                    placeholder="Add a city (e.g., London)"
                    value={newCity}
                    onChangeText={setNewCity}
                />
                <Pressable
                    style={[styles.addBtn, { backgroundColor: activeTheme.accent }]}
                    onPress={addCity}
                >
                    <Text style={styles.addBtnText}>Add</Text>
                </Pressable>
            </View>

            {/* Header row: Locations + Settings */}
            <View style={styles.rowBetween}>
                <Text style={[styles.h2, { color: activeTheme.text }]}>Locations</Text>
                <Pressable onPress={() => navigation.navigate("Settings")}>
                    <Text style={[styles.link, { color: activeTheme.accent }]}>Settings</Text>
                </Pressable>
            </View>

            {/* List of saved cities */}
            <FlatList
                data={cities}
                keyExtractor={(item) => item}
                contentContainerStyle={{ gap: 10, paddingVertical: 12 }}
                renderItem={({ item }) => (
                    <CityRow
                        city={item}
                        weather={weatherMap[item]}
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
});