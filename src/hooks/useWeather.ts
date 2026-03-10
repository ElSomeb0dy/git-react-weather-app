import { useEffect, useState } from "react";
import { fetchCurrentWeather } from "../services/openWeather";
import { CurrentWeather } from "../types/weather";

export function useWeather(city: string) {
    const [data, setData] = useState<CurrentWeather | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // The "alive" flag prevents memory leaks by tracking if the
        // component is still mounted when the async operation finishes
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
                // Ensure loading indicator is always toggled off
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [city]);

    return { data, loading, error };
}