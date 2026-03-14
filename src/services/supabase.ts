import Constants from "expo-constants";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

// Use existing cross-platform secure storage adapter
import { secureGet, secureSet, secureDelete } from "../storage/secure";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

const supabaseUrl = extra.SUPABASE_URL as string;
const supabaseAnonKey = extra.SUPABASE_ANON_KEY as string;

// Minimal storage adapter Supabase expects
const ExpoStorage = {
    getItem: (key: string) => secureGet(key),
    setItem: (key: string, value: string) => secureSet(key, value),
    removeItem: (key: string) => secureDelete(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: ExpoStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: Platform.OS === "web", 
    },
});