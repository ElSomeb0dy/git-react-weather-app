import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { CurrentWeather, ForecastDay } from "../types/weather";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_PREFIX = "groq_insight:";

function getApiKey(): string | undefined {
  return Constants.expoConfig?.extra?.GROQ_API_KEY as string | undefined;
}

async function fetchGroqInsight(weather: CurrentWeather, forecast: ForecastDay[]): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No Groq API key");

  const { city, country, tempC, feelsLikeC, description, humidity, windSpeed } = weather;
  const forecastLine =
    forecast.length > 0
      ? ` Tomorrow: ${forecast[0].description}, ${Math.round(forecast[0].minTempC)}–${Math.round(forecast[0].maxTempC)}°C.`
      : "";

  const prompt =
    `Weather in ${city}, ${country}: ${Math.round(tempC)}°C (feels like ${Math.round(feelsLikeC)}°C), ` +
    `${description}, humidity ${humidity}%, wind ${windSpeed} m/s.${forecastLine}\n\n` +
    `Write a short, casual 2-sentence weather summary followed by a one-line clothing suggestion. No markdown, keep it under 40 words total.`;

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 80,
      temperature: 0.8,
    }),
  });

  if (!res.ok) throw new Error(`Groq error ${res.status}`);

  const data = await res.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty Groq response");
  return text.trim();
}

async function getCached(key: string): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { text, ts } = JSON.parse(raw);
    return Date.now() - ts < CACHE_TTL_MS ? text : null;
  } catch {
    return null;
  }
}

async function setCached(key: string, text: string): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ text, ts: Date.now() }));
  } catch {}
}

export type InsightResult = { text: string; source: "ai" | "local" };

export async function getWeatherInsight(
  weather: CurrentWeather,
  forecast: ForecastDay[]
): Promise<InsightResult> {
  if (getApiKey()) {
    const cacheKey = `${weather.city}:${weather.condition}:${Math.round(weather.tempC)}`;
    const cached = await getCached(cacheKey);
    if (cached) return { text: cached, source: "ai" };
    try {
      const text = await fetchGroqInsight(weather, forecast);
      await setCached(cacheKey, text);
      return { text, source: "ai" };
    } catch (e) {
      console.warn("[Groq] failed:", e);
    }
  }
  const { description, tempC, city } = weather;
  return { text: `${description} in ${city}. Currently ${Math.round(tempC)}°C.`, source: "local" };
}
