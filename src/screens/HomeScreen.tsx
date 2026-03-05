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
import { fetchCurrentWeather } from "../services/openWeather";
import { CurrentWeather } from "../types/weather";
import { themeForCondition } from "../theme/weatherTheme";
import CityRow from "../components/CityRow";
import { supabase } from "../services/supabase";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

type CityRowDb = {
    city: string;
};

export default function HomeScreen({ navigation }: Props) {
    const [cities, setCities] = useState<string[]>([]);
    const [newCity, setNewCity] = useState("");
    const [loading, setLoading] = useState(true);
    const [weatherMap, setWeatherMap] = useState<Record<string, CurrentWeather>>({});

    // Pick first city's weather as the global screen theme
    const activeTheme = useMemo(() => {
        const first = cities[0] && weatherMap[cities[0]];
        return first ? themeForCondition(first.condition) : themeForCondition("Clouds");
    }, [cities, weatherMap]);

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

        if (cities.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
            Alert.alert("Already added", "That city is already in your list.");
            return;
        }

        // Validate the city by calling OpenWeather once
        try {
            await fetchCurrentWeather(trimmed);
        } catch {
            Alert.alert("City not found", "OpenWeatherMap couldn't find that city.");
            return;
        }

        // Insert into Supabase (RLS ensures it saves for the logged-in user)
        const { error } = await supabase.from("user_cities").insert({ city: trimmed });

        if (error) {
            console.warn(error);

            // Nice message for the common "duplicate city" case
            if (error.code === "23505") {
                Alert.alert("Already added", "That city is already in your list.");
                return;
            }

            Alert.alert("Database error", "Couldn't save that city.");
            return;
        }

        // Update local UI immediately
        const updated = [trimmed, ...cities];
        setCities(updated);
        setNewCity("");
    };

    const removeCity = async (city: string) => {
        // Delete from Supabase (RLS ensures it only affects this user's rows)
        const { error } = await supabase.from("user_cities").delete().eq("city", city);

        if (error) {
            console.warn(error);
            Alert.alert("Database error", "Couldn't remove that city.");
            return;
        }

        // Update local UI immediately
        const updated = cities.filter((c) => c !== city);
        setCities(updated);
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
            <View style={styles.row}>
                <TextInput
                    style={[styles.input, { backgroundColor: activeTheme.card }]}
                    placeholder="Add a city (e.g., London)"
                    value={newCity}
                    onChangeText={setNewCity}
                />
                <Pressable style={[styles.addBtn, { backgroundColor: activeTheme.accent }]} onPress={addCity}>
                    <Text style={styles.addBtnText}>Add</Text>
                </Pressable>
            </View>

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