import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { fetchCurrentWeatherByCoords, fetchNextSlots } from "../services/openWeather";
import { CurrentWeather, ForecastSlot } from "../types/weather";

export function useLocationWeather() {
    const [locationWeather, setLocationWeather] = useState<CurrentWeather | null>(null);
    const [locationSlots, setLocationSlots] = useState<ForecastSlot[]>([]);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;
            const loc = await Location.getCurrentPositionAsync({});
            try {
                const w = await fetchCurrentWeatherByCoords(loc.coords.latitude, loc.coords.longitude);
                setLocationWeather(w);
                const slots = await fetchNextSlots(w.city);
                setLocationSlots(slots);
            } catch (e) {
                console.warn("Location weather failed", e);
            }
        })();
    }, []);

    return { locationWeather, locationSlots };
}
