// src/components/CityRow.tsx
import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { CurrentWeather } from "../types/weather";

type Props = {
    city: string;
    weather?: CurrentWeather;
    unit: "C" | "F";
    onOpen: () => void;
    onRemove: () => void;
};

export default function CityRow({ city, weather, unit, onOpen, onRemove }: Props) {
    const temp =
        weather
            ? unit === "C"
                ? `${weather.tempC}°C`
                : `${weather.tempF}°F`
            : null;

    return (
        <Pressable testID="city-row" style={styles.card} onPress={onOpen}>
            <View style={{ flex: 1 }}>
                <Text style={styles.city}>{city}</Text>
                <Text>{weather ? `${weather.description} • ${temp}` : "Loading weather…"}</Text>
            </View>

            <Pressable testID="remove-city" onPress={onRemove} style={styles.removeBtn}>
                <Text style={styles.removeText}>Remove</Text>
            </Pressable>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: { borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center" },
    city: { fontSize: 18, fontWeight: "800" },
    removeBtn: { paddingHorizontal: 8, paddingVertical: 6 },
    removeText: { color: "#EF4444", fontWeight: "700" },
});