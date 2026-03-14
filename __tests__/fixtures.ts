import { CurrentWeather } from "../src/types/weather";

export const mockWeather: CurrentWeather = {
    city: "Paris",
    country: "FR",
    tempC: 10,
    tempF: 50,
    feelsLikeC: 8,
    feelsLikeF: 46.4,
    minTempC: 9,
    minTempF: 48.2,
    maxTempC: 11,
    maxTempF: 51.8,
    condition: "Clouds",
    description: "Overcast Clouds",
    icon: "04d",
    humidity: 70,
    windSpeed: 3.5,
    pressure: 1013,
    visibility: 10000,
    sunrise: 1700000000000,
    sunset: 1700040000000,
    timezone: 3600,
    updatedAt: 1700000000000,
};

/** Raw OpenWeatherMap API response matching mockWeather */
export const mockApiResponse = {
    name: "Paris",
    sys: { country: "FR", sunrise: 1700000, sunset: 1700040 },
    main: {
        temp: 283.15,       
        feels_like: 281.15, 
        temp_min: 282.15,   
        temp_max: 284.15,   
        humidity: 70,
        pressure: 1013,
    },
    weather: [{ main: "Clouds", description: "overcast clouds", icon: "04d" }],
    wind: { speed: 3.5 },
    visibility: 10000,
};
