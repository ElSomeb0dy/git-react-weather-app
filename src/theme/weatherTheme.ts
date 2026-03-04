import { WeatherCondition } from "../types/weather";

export type Theme = {
    background: string;
    card: string;
    text: string;
    subtleText: string;
    accent: string;
};

const THEMES: Record<string, Theme> = {
    Clear: {
        background: "#FFEDD5", // warm
        card: "#FFF7ED",
        text: "#1F2937",
        subtleText: "#4B5563",
        accent: "#F97316",
    },
    Rain: {
        background: "#DBEAFE",
        card: "#EFF6FF",
        text: "#0F172A",
        subtleText: "#334155",
        accent: "#2563EB",
    },
    Snow: {
        background: "#F1F5F9",
        card: "#FFFFFF",
        text: "#0F172A",
        subtleText: "#334155",
        accent: "#64748B",
    },
    Clouds: {
        background: "#E5E7EB",
        card: "#F3F4F6",
        text: "#111827",
        subtleText: "#374151",
        accent: "#6B7280",
    },
    Thunderstorm: {
        background: "#EDE9FE",
        card: "#F5F3FF",
        text: "#111827",
        subtleText: "#374151",
        accent: "#7C3AED",
    },
};

export function themeForCondition(condition: WeatherCondition): Theme {
    return THEMES[condition] ?? THEMES.Clouds;
}