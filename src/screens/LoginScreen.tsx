import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/types";
import { signIn, signUp, resetPassword } from "../services/auth";

import { themeForCondition } from "../theme/weatherTheme";
import ThemeBackground from "../components/ThemeBackground";

const cloudsTheme = themeForCondition("Clouds");

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

const Chip = ({ label, bg, text }: { label: string; bg: string; text: string }) => (
  <View style={[styles.chip, { backgroundColor: bg }]}>
    <Text style={[styles.chipText, { color: text }]}>{label}</Text>
  </View>
);

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
    if (!email.trim().includes("@")) return (showError("Please enter a valid email."), false);
    if (password.length < 6) return (showError("Password must be at least 6 characters."), false);
    return true;
  };

  const onLogin = async () => {
    if (submitting) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          showError("Incorrect email or password.");
        } else {
          showError(error.message);
        }
        return;
      }

      showSuccess("Logged in!");

      // Reset stack so user can't go "back" to Login
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onSignup = async () => {
    if (submitting) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { error } = await signUp(email, password);
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
      const { error } = await resetPassword(email);
      if (error) return showError(error.message);
      showSuccess("Password reset email sent (if the account exists).");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#DBEAFE" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      <ThemeBackground theme={cloudsTheme} />
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        {/* Hero */}
        <View style={styles.header}>
          <View style={styles.sun}>
            {Array.from({ length: 8 }).map((_, i) => (
              <View key={i} style={[styles.ray, { transform: [{ rotate: `${i * 45}deg` }] }]} />
            ))}
            <View style={styles.sunCore} />
          </View>
          <Text style={styles.title}>React Weather</Text>
          <View style={styles.chipRow}>
            <Chip label="Clear" bg="#FFB703" text="#0B1220" />
            <Chip label="Rain" bg="#0EA5E9" text="#06111D" />
            <Chip label="Snow" bg="#E0F2FE" text="#0B1220" />
          </View>
        </View>

        <View style={styles.feedbackSlot}>
          {!!message && (
            <Text style={[styles.message, messageType === "error" ? styles.msgErr : styles.msgOk]}>
              {message}
            </Text>
          )}
        </View>

        {/* Auth card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome</Text>
          <Text style={styles.cardSubtitle}>Login or sign up to continue</Text>

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
        </View>

        <Pressable disabled={submitting} onPress={onForgotPassword}>
          <Text style={styles.link}>Forgot password?</Text>
        </Pressable>

        <Text style={styles.footerNote}>Your saved cities are tied to your account.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: { fontWeight: "900", fontSize: 12 },

  screen: {
    flexGrow: 1,
    padding: 16,
    justifyContent: "center",
    gap: 16,
    backgroundColor: "transparent",
  },

  feedbackSlot: { minHeight: 24, alignItems: "center", justifyContent: "center" },

  header: { alignItems: "center", marginBottom: 6 },
  sun: { width: 64, height: 64, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  ray: {
    position: "absolute",
    width: 4,
    height: 64,
    borderRadius: 2,
    backgroundColor: "#FBBF24",
    opacity: 0.7,
  },
  sunCore: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#FBBF24" },
  title: { fontSize: 28, fontWeight: "900", color: "#111827" },

  card: {
    backgroundColor: "rgba(245,249,255,0.85)",
    borderRadius: 18,
    paddingTop: 28,
    paddingHorizontal: 22,
    paddingBottom: 48,
    gap: 10,
    borderWidth: 1.5,
    borderColor: "rgba(186,216,255,0.6)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  cardSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: -6,
    marginBottom: 26,
  },

  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "white",
  },

  pwRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  showBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  showBtnText: { fontWeight: "800", color: "#111827" },

  primaryBtn: { backgroundColor: "#0284C7", padding: 14, borderRadius: 12, marginTop: 4 },
  primaryText: { color: "white", textAlign: "center", fontWeight: "800" },

  secondaryBtn: { backgroundColor: "#1E3A5F", padding: 14, borderRadius: 12 },
  secondaryText: { color: "white", textAlign: "center", fontWeight: "800" },

  link: { color: "#2563EB", textAlign: "center", fontWeight: "700", marginTop: 4 },

  disabled: { opacity: 0.6 },

  message: { textAlign: "center", fontWeight: "700", marginTop: 6 },
  msgErr: { color: "#DC2626" },
  msgOk: { color: "#16A34A" },

  footerNote: { textAlign: "center", color: "#6B7280" },
});
