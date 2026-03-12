import Constants from "expo-constants";
import { CurrentWeather, ForecastDay, ForecastSlot, WeatherCondition } from "../types/weather";

const API_KEY = Constants.expoConfig?.extra?.OPENWEATHER_API_KEY as string;

const BASE = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST = "https://api.openweathermap.org/data/2.5/forecast";
const GEO = "https://api.openweathermap.org/geo/1.0/direct";

const kelvinToC = (k: number) => k - 273.15;
const cToF = (c: number) => (c * 9) / 5 + 32;
const round1dp = (n: number) => Math.round(n * 10) / 10;

function parseWeatherData(data: any): CurrentWeather {
    const c = kelvinToC(data.main.temp);
    const fl = kelvinToC(data.main.feels_like);
    const min = kelvinToC(data.main.temp_min);
    const max = kelvinToC(data.main.temp_max);
    const condition = (data.weather?.[0]?.main ?? "Clouds") as WeatherCondition;

    return {
        city: data.name,
        country: data.sys.country,
        tempC: round1dp(c),
        tempF: round1dp(cToF(c)),
        condition,
        description: (data.weather?.[0]?.description ?? "").replace(/\b\w/g, (ch: string) => ch.toUpperCase()),
        icon: data.weather?.[0]?.icon ?? "01d",
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        feelsLikeC: round1dp(fl),
        feelsLikeF: round1dp(cToF(fl)),
        minTempC: round1dp(min),
        minTempF: round1dp(cToF(min)),
        maxTempC: round1dp(max),
        maxTempF: round1dp(cToF(max)),
        pressure: data.main.pressure,
        visibility: data.visibility ?? 0,
        sunrise: data.sys.sunrise ? data.sys.sunrise * 1000 : null,
        sunset: data.sys.sunset ? data.sys.sunset * 1000 : null,
        timezone: data.timezone ?? 0,
        updatedAt: Date.now(),
    };
}

export type CitySuggestion = {
    label: string;
    name: string;
    country: string;
    state?: string;
    lat: number;
    lon: number;
};

export async function fetchCitySuggestions(query: string, limit = 5): Promise<CitySuggestion[]> {
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
    return parseWeatherData(data);
}

export async function fetchCurrentWeather(city: string): Promise<CurrentWeather> {
    const url = `${BASE}?q=${encodeURIComponent(city)}&appid=${API_KEY}`;

    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Weather fetch failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    return parseWeatherData(data);
}

export async function fetchForecast(city: string): Promise<ForecastDay[]> {
    const url = `${FORECAST}?q=${encodeURIComponent(city)}&appid=${API_KEY}`;

    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Forecast fetch failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    const list: any[] = data.list ?? [];

    // Group 3-hour slots by local date string
    const byDay = new Map<string, any[]>();
    for (const item of list) {
        const day = new Date(item.dt * 1000).toDateString();
        if (!byDay.has(day)) byDay.set(day, []);
        byDay.get(day)!.push(item);
    }

    // Skip today, take up to 5 remaining days
    const today = new Date().toDateString();
    const days = [...byDay.entries()].filter(([d]) => d !== today).slice(0, 5);

    return days.map(([day, slots]) => {
        const temps = slots.map((s: any) => kelvinToC(s.main.temp));
        const minC = round1dp(Math.min(...temps));
        const maxC = round1dp(Math.max(...temps));
        // Pick midday slot for representative condition/icon
        const mid = slots.find((s: any) => new Date(s.dt * 1000).getHours() >= 12) ?? slots[0];
        const condition = (mid.weather?.[0]?.main ?? "Clouds") as WeatherCondition;
        const description = (mid.weather?.[0]?.description ?? "").replace(
            /\b\w/g,
            (ch: string) => ch.toUpperCase()
        );

        return {
            date: new Date(day).getTime(),
            minTempC: minC,
            maxTempC: maxC,
            minTempF: round1dp(cToF(minC)),
            maxTempF: round1dp(cToF(maxC)),
            condition,
            description,
            icon: mid.weather?.[0]?.icon ?? "01d",
        };
    });
}

export async function fetchNextSlots(city: string, count = 8): Promise<ForecastSlot[]> {
    const url = `${FORECAST}?q=${encodeURIComponent(city)}&appid=${API_KEY}`;

    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const list: any[] = data.list ?? [];

    return list.slice(0, count).map((item) => {
        const c = kelvinToC(item.main.temp);
        return {
            time: item.dt * 1000,
            tempC: round1dp(c),
            tempF: round1dp(cToF(c)),
            icon: item.weather?.[0]?.icon ?? "01d",
        };
    });
}