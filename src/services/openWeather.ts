import Constants from "expo-constants";
import { CurrentWeather, WeatherCondition } from "../types/weather";

const API_KEY = Constants.expoConfig?.extra?.OPENWEATHER_API_KEY as string;

const BASE = "https://api.openweathermap.org/data/2.5/weather";

const kelvinToC = (k: number) => k - 273.15;
const cToF = (c: number) => (c * 9) / 5 + 32;

export async function fetchCurrentWeather(city: string): Promise<CurrentWeather> {
    const url = `${BASE}?q=${encodeURIComponent(city)}&appid=${API_KEY}`;

    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Weather fetch failed (${res.status}): ${text}`);
    }

    const data = await res.json();

    // TEMP DEBUG: see what OpenWeather resolved your query to
    console.log(
        "[OpenWeather] requested:",
        city,
        "| resolved:",
        data?.name,
        data?.sys?.country,
        "| id:",
        data?.id
    );

    const c = kelvinToC(data.main.temp);
    const condition = (data.weather?.[0]?.main ?? "Clouds") as WeatherCondition;

    return {
        city: data.name,
        country: data.sys.country,
        tempC: Math.round(c * 10) / 10,
        tempF: Math.round(cToF(c) * 10) / 10,
        condition,
        description: data.weather?.[0]?.description ?? "",
        icon: data.weather?.[0]?.icon ?? "01d",
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        updatedAt: Date.now(),
    };
}