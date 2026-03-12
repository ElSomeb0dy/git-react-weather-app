import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "./keys";

export type HomeThemeMode = "location" | "top" | "fixed";

export type Settings = {
    unit: "C" | "F";
    homeTheme: HomeThemeMode;
    fixedTheme: string; 
};

const DEFAULT_SETTINGS: Settings = { unit: "C", homeTheme: "top", fixedTheme: "Clouds" };

export async function loadSettings(): Promise<Settings> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export async function saveSettings(settings: Settings) {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}
