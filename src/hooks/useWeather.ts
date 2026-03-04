import { useEffect, useState } from "react";
import { fetchCurrentWeather } from "../services/openWeather";
import { CurrentWeather } from "../types/weather";

export function useWeather(city: string) {
    const [data, setData] = useState<CurrentWeather | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;

        (async () => {
            setLoading(true);
            setError(null);

            try {
                const w = await fetchCurrentWeather(city);
                if (alive) setData(w);
            } catch (e: any) {
                if (alive) setError(e?.message ?? "Unknown error");
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [city]);

    return { data, loading, error };
}