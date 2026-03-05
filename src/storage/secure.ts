import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export async function secureSet(key: string, value: string) {
    if (Platform.OS === "web") {
        await AsyncStorage.setItem(key, value);
        return;
    }
    await SecureStore.setItemAsync(key, value);
}

export async function secureGet(key: string) {
    if (Platform.OS === "web") {
        return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
}

export async function secureDelete(key: string) {
    if (Platform.OS === "web") {
        await AsyncStorage.removeItem(key);
        return;
    }
    await SecureStore.deleteItemAsync(key);
}