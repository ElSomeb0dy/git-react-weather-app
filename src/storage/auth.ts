import * as SecureStore from "expo-secure-store";

const AUTH_KEY = "auth_session";

export type Session = {
    email: string;
    loggedInAt: number;
};

export async function getSession(): Promise<Session | null> {
    const raw = await SecureStore.getItemAsync(AUTH_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as Session;
    } catch {
        return null;
    }
}

export async function setSession(email: string) {
    const session: Session = { email, loggedInAt: Date.now() };
    await SecureStore.setItemAsync(AUTH_KEY, JSON.stringify(session));
}

export async function clearSession() {
    await SecureStore.deleteItemAsync(AUTH_KEY);
}