import Constants from "expo-constants";
import { CurrentWeather, WeatherCondition } from "../types/weather";

const API_KEY = Constants.expoConfig?.extra?.OPENWEATHER_API_KEY as string;

const BASE = "https://api.openweathermap.org/data/2.5/weather";
const GEO = "https://api.openweathermap.org/geo/1.0/direct";

const kelvinToC = (k: number) => k - 273.15;
const cToF = (c: number) => (c * 9) / 5 + 32;

export type CitySuggestion = {
    label: string;
    name: string;
    country: string;
    state?: string;
    lat: number;
    lon: number;
};

export async function fetchCitySuggestions(query: string, limit = 6): Promise<CitySuggestion[]> {
    if (!query.trim()) return [];

    const url = `${GEO}?q=${encodeURIComponent(query)}&limit=${limit}&appid=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const raw: CitySuggestion[] = data.map((x: any) => {
        const parts = [x.name, x.state, x.country].filter(Boolean);
        return {
            label: parts.join(", "),
            name: x.name,
            state: x.state,
            country: x.country,
            lat: x.lat,
            lon: x.lon,
        };
    });

    const seenLabel = new Set<string>();
    const seenCoord = new Set<string>();
    const out: CitySuggestion[] = [];

    for (const s of raw) {
        const coordKey = `${s.lat},${s.lon}`;
        if (seenCoord.has(coordKey)) continue;
        if (seenLabel.has(s.label)) continue;

        seenCoord.add(coordKey);
        seenLabel.add(s.label);
        out.push(s);
    }

    return out;
}

export async function fetchCurrentWeatherByCoords(lat: number, lon: number): Promise<CurrentWeather> {
    const url = `${BASE}?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Weather fetch failed (${res.status}): ${text}`);
    }

    const data = await res.json();

    const c = kelvinToC(data.main.temp);
    const fl = kelvinToC(data.main.feels_like);
    const min = kelvinToC(data.main.temp_min);
    const max = kelvinToC(data.main.temp_max);
    const condition = (data.weather?.[0]?.main ?? "Clouds") as WeatherCondition;

    return {
        city: data.name,
        country: data.sys.country,
        tempC: Math.round(c * 10) / 10,
        tempF: Math.round(cToF(c) * 10) / 10,
        condition,
        description: (data.weather?.[0]?.description ?? "").replace(/\b\w/g, (ch: string) => ch.toUpperCase()),
        icon: data.weather?.[0]?.icon ?? "01d",
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        feelsLikeC: Math.round(fl * 10) / 10,
        feelsLikeF: Math.round(cToF(fl) * 10) / 10,
        minTempC: Math.round(min * 10) / 10,
        minTempF: Math.round(cToF(min) * 10) / 10,
        maxTempC: Math.round(max * 10) / 10,
        maxTempF: Math.round(cToF(max) * 10) / 10,
        pressure: data.main.pressure,
        visibility: data.visibility ?? 0,
        sunrise: data.sys.sunrise ? data.sys.sunrise * 1000 : null,
        sunset: data.sys.sunset ? data.sys.sunset * 1000 : null,
        updatedAt: Date.now(),
    };
}

export async function fetchCurrentWeather(city: string): Promise<CurrentWeather> {
    const url = `${BASE}?q=${encodeURIComponent(city)}&appid=${API_KEY}`;

    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Weather fetch failed (${res.status}): ${text}`);
    }

    const data = await res.json();

    const c = kelvinToC(data.main.temp);
    const fl = kelvinToC(data.main.feels_like);
    const min = kelvinToC(data.main.temp_min);
    const max = kelvinToC(data.main.temp_max);
    const condition = (data.weather?.[0]?.main ?? "Clouds") as WeatherCondition;

    return {
        city: data.name,
        country: data.sys.country,
        tempC: Math.round(c * 10) / 10,
        tempF: Math.round(cToF(c) * 10) / 10,
        condition,
        description: (data.weather?.[0]?.description ?? "").replace(/\b\w/g, (ch: string) => ch.toUpperCase()),
        icon: data.weather?.[0]?.icon ?? "01d",
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        feelsLikeC: Math.round(fl * 10) / 10,
        feelsLikeF: Math.round(cToF(fl) * 10) / 10,
        minTempC: Math.round(min * 10) / 10,
        minTempF: Math.round(cToF(min) * 10) / 10,
        maxTempC: Math.round(max * 10) / 10,
        maxTempF: Math.round(cToF(max) * 10) / 10,
        pressure: data.main.pressure,
        visibility: data.visibility ?? 0,
        sunrise: data.sys.sunrise ? data.sys.sunrise * 1000 : null,
        sunset: data.sys.sunset ? data.sys.sunset * 1000 : null,
        updatedAt: Date.now(),
    };
}