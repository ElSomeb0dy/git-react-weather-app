import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { CurrentWeather } from "../types/weather";

type Props = {
    city: string;
    weather?: CurrentWeather;
    onOpen: () => void;
    onRemove: () => void;
};

export default function CityRow({ city, weather, onOpen, onRemove }: Props) {
    return (
        // Navigate to the weather detail screen on tap
        <Pressable testID="city-row" style={styles.card} onPress={onOpen}>
            {/* Display city identity and current weather metrics */}
            <View style={{ flex: 1 }}>
                <Text style={styles.city}>{city}</Text>
                <Text>
                    {weather ? `${weather.description} • ${weather.tempC}°C` : "Loading weather…"}
                </Text>
            </View>

            {/* Action trigger to delete the current entry from storage */}
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