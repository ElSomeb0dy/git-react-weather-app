import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { getSession } from "../storage/auth";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export default function SplashScreen({ navigation }: Props) {
    useEffect(() => {
        (async () => {
            const session = await getSession();
            navigation.replace(session ? "Home" : "Login");
        })();
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