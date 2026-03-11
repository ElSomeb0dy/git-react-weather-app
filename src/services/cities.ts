import { supabase } from "./supabase";

type CityRow = { city: string };

export const getCities = () =>
    supabase
        .from("user_cities")
        .select("city")
        .order("created_at", { ascending: false })
        .returns<CityRow[]>();

export const insertCity = (city: string) =>
    supabase.from("user_cities").insert({ city });

export const deleteCity = (city: string) =>
    supabase.from("user_cities").delete().eq("city", city);
