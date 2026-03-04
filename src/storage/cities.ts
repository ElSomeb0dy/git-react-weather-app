import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "./keys";

export async function loadCities(): Promise<string[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CITIES);
    if (!raw) return ["Paris"]; // default
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : ["Paris"];
    } catch {
        return ["Paris"];
    }
}

export async function saveCities(cities: string[]) {
    await AsyncStorage.setItem(STORAGE_KEYS.CITIES, JSON.stringify(cities));
}