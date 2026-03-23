import { supabase } from "./supabase";

export const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

export const signUp = (email: string, password: string) =>
    supabase.auth.signUp({ email, password });

export const resetPassword = (email: string) => supabase.auth.resetPasswordForEmail(email);

export const signOut = () => supabase.auth.signOut();

export const getSession = () => supabase.auth.getSession();

export const onAuthStateChange: typeof supabase.auth.onAuthStateChange = (callback) =>
    supabase.auth.onAuthStateChange(callback);
