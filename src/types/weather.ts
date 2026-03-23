export type WeatherCondition =
  | "Thunderstorm"
  | "Drizzle"
  | "Rain"
  | "Snow"
  | "Mist"
  | "Smoke"
  | "Haze"
  | "Dust"
  | "Fog"
  | "Sand"
  | "Ash"
  | "Squall"
  | "Tornado"
  | "Clear"
  | "Clouds";

export type ForecastSlot = {
  time: number;
  tempC: number;
  tempF: number;
  icon: string;
};

export type ForecastDay = {
  date: number;
  minTempC: number;
  maxTempC: number;
  minTempF: number;
  maxTempF: number;
  condition: WeatherCondition;
  description: string;
  icon: string;
};

export type CurrentWeather = {
  city: string;
  country: string;
  tempC: number;
  tempF: number;
  feelsLikeC: number;
  feelsLikeF: number;
  minTempC: number;
  minTempF: number;
  maxTempC: number;
  maxTempF: number;
  condition: WeatherCondition;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
  sunrise: number | null;
  sunset: number | null;
  timezone: number;
  updatedAt: number;
};
