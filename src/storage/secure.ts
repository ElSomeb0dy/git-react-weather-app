import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const SECURE_STORE_LIMIT = 2048;

export async function secureSet(key: string, value: string) {
    if (Platform.OS === "web" || value.length > SECURE_STORE_LIMIT) {
        await AsyncStorage.setItem(key, value);
        return;
    }
    await SecureStore.setItemAsync(key, value);
}

export async function secureGet(key: string) {
    if (Platform.OS === "web") {
        return AsyncStorage.getItem(key);
    }
    const secure = await SecureStore.getItemAsync(key);
    if (secure !== null) return secure;
    return AsyncStorage.getItem(key);
}

export async function secureDelete(key: string) {
    if (Platform.OS === "web") {
        await AsyncStorage.removeItem(key);
        return;
    }
    await SecureStore.deleteItemAsync(key);
}