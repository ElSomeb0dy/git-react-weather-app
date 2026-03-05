import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { supabase } from "../services/supabase";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"error" | "success">("error");

    const showError = (t: string) => {
        setMessageType("error");
        setMessage(t);
    };
    const showSuccess = (t: string) => {
        setMessageType("success");
        setMessage(t);
    };

    const validate = () => {
        setMessage("");
        if (!email.trim().includes("@")) return showError("Enter a valid email."), false;
        if (password.length < 6) return showError("Password must be at least 6 characters."), false;
        return true;
    };

    const onLogin = async () => {
        if (submitting) return;
        if (!validate()) return;

        setSubmitting(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                if (error.message.toLowerCase().includes("invalid login credentials")) {
                    showError("Incorrect email or password.");
                } else {
                    showError(error.message);
                }
                return;
            }
            showSuccess("Logged in!");
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
            if (error) return showError(error.message);
            showSuccess("Account created. You can now log in.");
        } finally {
            setSubmitting(false);
        }
    };

    const onForgotPassword = async () => {
        if (!email.trim().includes("@")) {
            showError("Enter your email first, then tap Forgot password.");
            return;
        }
        setSubmitting(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) return showError(error.message);
            showSuccess("Password reset email sent (if the account exists).");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.screen}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.logo}>☀️</Text>
                <Text style={styles.title}>React Weather</Text>
                <Text style={styles.subtitle}>Log in to sync your saved cities</Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Sign in</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={(t) => {
                        setEmail(t);
                        setMessage("");
                    }}
                    editable={!submitting}
                    returnKeyType="next"
                />

                <View style={styles.pwRow}>
                    <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Password"
                        secureTextEntry={!showPw}
                        value={password}
                        onChangeText={(t) => {
                            setPassword(t);
                            setMessage("");
                        }}
                        editable={!submitting}
                        returnKeyType="done"
                    />
                    <Pressable style={styles.showBtn} onPress={() => setShowPw((v) => !v)}>
                        <Text style={styles.showBtnText}>{showPw ? "Hide" : "Show"}</Text>
                    </Pressable>
                </View>

                <Pressable
                    disabled={submitting}
                    style={[styles.primaryBtn, submitting && styles.disabled]}
                    onPress={onLogin}
                >
                    <Text style={styles.primaryText}>{submitting ? "Working..." : "Log in"}</Text>
                </Pressable>

                <Pressable
                    disabled={submitting}
                    style={[styles.secondaryBtn, submitting && styles.disabled]}
                    onPress={onSignup}
                >
                    <Text style={styles.secondaryText}>Create account</Text>
                </Pressable>

                <Pressable disabled={submitting} onPress={onForgotPassword}>
                    <Text style={styles.link}>Forgot password?</Text>
                </Pressable>

                {!!message && (
                    <Text style={[styles.message, messageType === "error" ? styles.msgErr : styles.msgOk]}>
                        {message}
                    </Text>
                )}
            </View>

            <Text style={styles.footerNote}>Your saved cities are tied to your account.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, padding: 16, justifyContent: "center", gap: 16, backgroundColor: "#E5E7EB" },
    header: { alignItems: "center", marginBottom: 6 },
    logo: { fontSize: 42, marginBottom: 6 },
    title: { fontSize: 28, fontWeight: "900" },
    subtitle: { marginTop: 6, color: "#374151", textAlign: "center" },

    card: { backgroundColor: "white", borderRadius: 18, padding: 16, gap: 10 },
    cardTitle: { fontSize: 18, fontWeight: "800", marginBottom: 4 },

    input: {
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "white",
    },

    pwRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    showBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: "#F3F4F6" },
    showBtnText: { fontWeight: "800", color: "#111827" },

    primaryBtn: { backgroundColor: "#111827", padding: 14, borderRadius: 12, marginTop: 4 },
    primaryText: { color: "white", textAlign: "center", fontWeight: "800" },

    secondaryBtn: { backgroundColor: "#374151", padding: 14, borderRadius: 12 },
    secondaryText: { color: "white", textAlign: "center", fontWeight: "800" },

    link: { color: "#2563EB", textAlign: "center", fontWeight: "700", marginTop: 4 },

    disabled: { opacity: 0.6 },

    message: { textAlign: "center", fontWeight: "700", marginTop: 6 },
    msgErr: { color: "#DC2626" },
    msgOk: { color: "#16A34A" },

    footerNote: { textAlign: "center", color: "#374151" },
});