import { useEffect, useState } from "react";
import { CurrentWeather, ForecastDay } from "../types/weather";
import { getWeatherInsight, InsightResult } from "../services/aiInsight";

export function useWeatherInsight(
    weather: CurrentWeather | null,
    forecast: ForecastDay[]
) {
    const [result, setResult] = useState<InsightResult | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!weather) return;

        let cancelled = false;
        setLoading(true);
        setResult(null);

        (async () => {
            try {
                const r = await getWeatherInsight(weather, forecast);
                if (!cancelled) setResult(r);
            } catch {}
            finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [weather?.city, weather?.condition, Math.round(weather?.tempC ?? 0)]);

    return { insight: result, loading };
}
