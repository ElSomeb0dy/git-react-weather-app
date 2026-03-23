import { supabase } from "./supabase";

export type CityEntry = { city: string; lat: number | null; lon: number | null };

export const getCities = () =>
  supabase
    .from("user_cities")
    .select("city, lat, lon")
    .order("created_at", { ascending: false })
    .returns<CityEntry[]>();

export const insertCity = (city: string, lat?: number, lon?: number) =>
  supabase.from("user_cities").insert({ city, lat: lat ?? null, lon: lon ?? null });

export const deleteCity = (city: string) => supabase.from("user_cities").delete().eq("city", city);
