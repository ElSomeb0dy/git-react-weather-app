export const formatTemp = (c: number, f: number, unit: "C" | "F"): string =>
    unit === "C" ? `${c}°` : `${f}°`;

export const formatTime = (value: number | null): string =>
    value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--";

export const weatherIconUrl = (icon: string): string =>
    `https://openweathermap.org/img/wn/${icon}@2x.png`;
