export type RootStackParamList = {
    Splash: undefined;
    Login: undefined;
    Home: undefined;
    WeatherDetail: { city: string; background?: string; lat?: number; lon?: number };
    Settings: {
        locationCondition: string; locationIsNight: boolean;
        topCondition: string; topIsNight: boolean;
    };
};