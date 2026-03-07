export type WeatherCondition =
    | "Clear"
    | "Clouds"
    | "Rain"
    | "Drizzle"
    | "Thunderstorm"
    | "Snow"
    | "Mist"
    | "Smoke"
    | "Haze"
    | "Dust"
    | "Fog"
    | "Sand"
    | "Ash"
    | "Squall"
    | "Tornado";

export type CurrentWeather = {
    city: string;
    country: string;
    tempC: number;
    tempF: number;
    condition: WeatherCondition;
    description: string;
    icon: string;
    humidity: number;
    windSpeed: number;
    feelsLikeC: number;
    feelsLikeF: number;
    updatedAt: number; // epoch ms
};