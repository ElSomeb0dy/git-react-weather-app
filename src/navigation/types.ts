export type RootStackParamList = {
    Splash: undefined;
    Login: undefined;
    Home: undefined;
    WeatherDetail: { city: string };
    Forecast: { city: string; condition: string };
    Settings: { condition: string };
};