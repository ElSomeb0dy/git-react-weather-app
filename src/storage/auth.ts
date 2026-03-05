import { secureGet, secureSet, secureDelete } from "./secure";

const AUTH_KEY = "auth_session";

export type Session = {
    email: string;
    loggedInAt: number;
};

export async function getSession(): Promise<Session | null> {
    const raw = await secureGet(AUTH_KEY);
    if (!raw) return null;

    try {
        return JSON.parse(raw) as Session;
    } catch {
        return null;
    }
}

export async function setSession(email: string) {
    const session: Session = { email, loggedInAt: Date.now() };
    await secureSet(AUTH_KEY, JSON.stringify(session));
}

export async function clearSession() {
    await secureDelete(AUTH_KEY);
}