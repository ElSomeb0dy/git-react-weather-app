import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { loadSettings, saveSettings } from "../storage/settings";
import { supabase } from "../services/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
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
        await supabase.auth.signOut();

        navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
        });
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={{ marginBottom: 8 }}>
                <Ionicons name="chevron-back" size={26} color="#111827" />
            </Pressable>
            <Text style={styles.h1}>Preferences</Text>

            <View style={styles.card}>
                <Text style={styles.label}>Temperature Unit</Text>
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