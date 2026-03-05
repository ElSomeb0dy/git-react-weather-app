import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { supabase } from "../services/supabase";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Prevents spamming login/signup -> avoids 429 rate-limit
    const [submitting, setSubmitting] = useState(false);

    const validate = () => {
        if (!email.includes("@")) {
            Alert.alert("Invalid email", "Please enter a valid email address.");
            return false;
        }
        // Supabase default requires 6+ chars
        if (password.length < 6) {
            Alert.alert("Invalid password", "Password must be at least 6 characters.");
            return false;
        }
        return true;
    };

    const onLogin = async () => {
        if (submitting) return;
        if (!validate()) return;

        setSubmitting(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                console.log("LOGIN ERROR:", error);
                Alert.alert("Login failed", error.message);
                return;
            }

            // If login succeeds, go to Home
            navigation.replace("Home");
        } finally {
            setSubmitting(false);
        }
    };

    const onSignup = async () => {
        if (submitting) return;
        if (!validate()) return;

        setSubmitting(true);
        try {
            const { error } = await supabase.auth.signUp({ email, password });

            if (error) {
                console.log("SIGNUP ERROR:", error);
                Alert.alert("Sign up failed", error.message);
                return;
            }

            // Depending on Supabase settings, user may need email confirmation
            Alert.alert(
                "Account created",
                "If email confirmations are enabled, check your inbox. Then log in."
            );
        } finally {
            setSubmitting(false);
        }
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
                editable={!submitting}
            />

            <TextInput
                style={styles.input}
                placeholder="Password (min 6 chars)"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                editable={!submitting}
            />

            <Pressable
                disabled={submitting}
                style={[styles.button, submitting && styles.buttonDisabled]}
                onPress={onLogin}
            >
                <Text style={styles.buttonText}>{submitting ? "Working..." : "Login"}</Text>
            </Pressable>

            <Pressable
                disabled={submitting}
                style={[styles.buttonSecondary, submitting && styles.buttonDisabled]}
                onPress={onSignup}
            >
                <Text style={styles.buttonText}>{submitting ? "Working..." : "Sign up"}</Text>
            </Pressable>

            <Text style={styles.note}>
                Tip: If sign up says “check your inbox”, you may need to confirm your email before logging in.
            </Text>
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
        backgroundColor: "white",
    },
    button: {
        backgroundColor: "#111827",
        padding: 14,
        borderRadius: 12,
        marginTop: 8,
    },
    buttonSecondary: {
        backgroundColor: "#374151",
        padding: 14,
        borderRadius: 12,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: { color: "white", textAlign: "center", fontWeight: "700" },
    note: { color: "#6B7280", marginTop: 10, textAlign: "center" },
});