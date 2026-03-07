import { WeatherCondition } from "../types/weather";

export type Decoration =
    | { type: "circle"; size: number; top?: number; bottom?: number; left?: number; right?: number; opacity?: number }
    | { type: "line"; width: number; height: number; top?: number; bottom?: number; left?: number; right?: number; rotateDeg?: number; opacity?: number };

export type Theme = {
    background: string;
    card: string;
    text: string;
    subtleText: string;
    accent: string;

    // Optional simple geometry decorations for the background
    decorations?: Decoration[];
};

// Different themes
const THEMES: Record<string, Theme> = {
    Clear: {
        background: "#FFEDD5",
        card: "rgba(255, 247, 237, 0.75)",
        text: "#1F2937",
        subtleText: "#4B5563",
        accent: "#F97316",
        decorations: [
            { type: "circle", size: 220, top: 40, right: -70, opacity: 0.18 },
            { type: "circle", size: 140, top: 120, right: -30, opacity: 0.12 },
        ],
    },
    Rain: {
        background: "#DBEAFE",
        card: "rgba(239, 246, 255, 0.75)",
        text: "#0F172A",
        subtleText: "#334155",
        accent: "#2563EB",
        decorations: [
            { type: "line", width: 4, height: 34, top: 90, left: 30, rotateDeg: 15, opacity: 0.20 },
            { type: "line", width: 4, height: 40, top: 140, left: 70, rotateDeg: 15, opacity: 0.18 },
            { type: "line", width: 4, height: 30, top: 110, left: 120, rotateDeg: 15, opacity: 0.16 },
            { type: "line", width: 4, height: 38, top: 170, left: 170, rotateDeg: 15, opacity: 0.18 },
        ],
    },
    Snow: {
        background: "#F1F5F9",
        card: "rgba(255, 255, 255, 0.75)",
        text: "#0F172A",
        subtleText: "#334155",
        accent: "#64748B",
        decorations: [
            { type: "circle", size: 10, top: 90, left: 40, opacity: 0.25 },
            { type: "circle", size: 8, top: 140, left: 110, opacity: 0.22 },
            { type: "circle", size: 12, top: 180, left: 220, opacity: 0.20 },
            { type: "circle", size: 9, top: 120, left: 280, opacity: 0.22 },
        ],
    },
    Clouds: {
        background: "#E5E7EB",
        card: "rgba(243, 244, 246, 0.75)",
        text: "#111827",
        subtleText: "#374151",
        accent: "#6B7280",
        decorations: [
            { type: "circle", size: 180, top: 70, left: -60, opacity: 0.12 },
            { type: "circle", size: 220, top: 110, left: 30, opacity: 0.10 },
            { type: "circle", size: 160, top: 60, right: -50, opacity: 0.10 },
        ],
    },
    Thunderstorm: {
        background: "#EDE9FE",
        card: "rgba(245, 243, 255, 0.75)",
        text: "#111827",
        subtleText: "#374151",
        accent: "#7C3AED",
        decorations: [
            { type: "circle", size: 200, top: 60, left: -70, opacity: 0.12 },
            { type: "line", width: 6, height: 46, top: 130, right: 40, rotateDeg: -15, opacity: 0.16 },
            { type: "line", width: 6, height: 34, top: 190, right: 70, rotateDeg: -15, opacity: 0.14 },
        ],
    },
};

export function themeForCondition(condition: WeatherCondition): Theme {
    return THEMES[condition] ?? THEMES.Clouds;
}