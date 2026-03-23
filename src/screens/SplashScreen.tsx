import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { getSession, onAuthStateChange } from "../services/auth";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export default function SplashScreen({ navigation }: Props) {
  // On mount: if session exists go to Home else Login
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await getSession();
      if (!mounted) return;
      navigation.replace(data.session ? "Home" : "Login");
    })();

    const { data: sub } = onAuthStateChange((_event, session) => {
      navigation.replace(session ? "Home" : "Login");
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>React Weather</Text>
      <ActivityIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 12 },
});
