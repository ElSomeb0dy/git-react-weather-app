import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { setSession } from "../storage/auth";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
    // Controlled inputs for email/password
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // MVP auth:
    // - we don't check a real database
    // - we do simple validation and then store a "session"
    const onLogin = async () => {
        if (!email.includes("@") || password.length < 4) {
            Alert.alert("Invalid login", "Use a real email + password length >= 4");
            return;
        }

        // Save session (persist login across restarts)
        await setSession(email);

        // Replace stack so user can't go "back" to login with Android back button
        navigation.replace("Home");
    };

    return (
        <View style={styles.container}>
            <Text style={styles.h1}>Welcome</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <Pressable style={styles.button} onPress={onLogin}>
                <Text style={styles.buttonText}>Login</Text>
            </Pressable>

            <Text style={styles.note}>(MVP auth: any valid-looking email + password works)</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, justifyContent: "center", gap: 12 },
    h1: { fontSize: 28, fontWeight: "700", marginBottom: 12 },
    input: {
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    button: { backgroundColor: "#111827", padding: 14, borderRadius: 12, marginTop: 8 },
    buttonText: { color: "white", textAlign: "center", fontWeight: "700" },
    note: { color: "#6B7280", marginTop: 10 },
});