import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { loadSettings, saveSettings } from "../storage/settings";
import { clearSession } from "../storage/auth";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
    // User preference for temperature unit
    const [unit, setUnit] = useState<"C" | "F">("C");

    // Load settings on mount
    useEffect(() => {
        (async () => {
            const s = await loadSettings();
            setUnit(s.unit);
        })();
    }, []);

    // Toggle C/F and persist to storage
    const toggleUnit = async () => {
        const next = unit === "C" ? "F" : "C";
        setUnit(next);
        await saveSettings({ unit: next });
    };

    // Log out by clearing session and going back to Login
    const logout = async () => {
        await clearSession();
        navigation.replace("Login");
    };

    return (
        <View style={styles.container}>
            <Text style={styles.h1}>Preferences</Text>

            <View style={styles.card}>
                <Text style={styles.label}>Temperature unit</Text>
                <Pressable style={styles.toggle} onPress={toggleUnit}>
                    <Text style={styles.toggleText}>
                        {unit === "C" ? "Celsius (°C)" : "Fahrenheit (°F)"}
                    </Text>
                </Pressable>
            </View>

            <Pressable style={styles.logout} onPress={logout}>
                <Text style={styles.logoutText}>Log out</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, gap: 12 },
    h1: { fontSize: 24, fontWeight: "900" },
    card: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 16, padding: 14 },
    label: { fontWeight: "800", marginBottom: 10 },
    toggle: { backgroundColor: "#111827", padding: 12, borderRadius: 12 },
    toggleText: { color: "white", fontWeight: "800", textAlign: "center" },
    logout: { marginTop: 16, backgroundColor: "#EF4444", padding: 14, borderRadius: 12 },
    logoutText: { color: "white", fontWeight: "900", textAlign: "center" },
});