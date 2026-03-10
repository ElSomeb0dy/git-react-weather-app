export const formatTemp = (c: number, f: number, unit: "C" | "F"): string =>
    unit === "C" ? `${c}°C` : `${f}°F`;

export const weatherIconUrl = (icon: string): string =>
    `https://openweathermap.org/img/wn/${icon}@2x.png`;
