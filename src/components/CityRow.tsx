// src/components/CityRow.tsx
import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { CurrentWeather } from "../types/weather";

type Props = {
    city: string;
    weather?: CurrentWeather;
    unit: "C" | "F";
    cardColor: string;
    textColor: string;
    onOpen: () => void;
    onRemove: () => void;
};

export default function CityRow({ city, weather, unit, cardColor, textColor, onOpen, onRemove }: Props) {
    const temp = weather
        ? unit === "C" ? `${weather.tempC}°C` : `${weather.tempF}°F`
        : null;

    return (
        <Pressable testID="city-row" style={[styles.card, { backgroundColor: cardColor }]} onPress={onOpen}>
            <View style={{ flex: 1 }}>
                <Text style={[styles.city, { color: textColor }]}>{city}</Text>
                <Text style={{ color: textColor, opacity: 0.7 }}>
                    {weather ? weather.description : "Loading weather…"}
                </Text>
            </View>

            <View style={styles.right}>
                {temp && <Text style={[styles.temp, { color: textColor }]}>{temp}</Text>}
                <Pressable testID="remove-city" onPress={onRemove} style={styles.removeBtn}>
                    <Text style={styles.removeText}>Remove</Text>
                </Pressable>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: { borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center" },
    city: { fontSize: 18, fontWeight: "800" },
    right: { alignItems: "flex-end", gap: 6 },
    temp: { fontSize: 22, fontWeight: "800" },
    removeBtn: { paddingHorizontal: 8, paddingVertical: 4 },
    removeText: { color: "#EF4444", fontWeight: "700", fontSize: 12 },
});