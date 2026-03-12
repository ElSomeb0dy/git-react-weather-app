export type RootStackParamList = {
    Splash: undefined;
    Login: undefined;
    Home: undefined;
    WeatherDetail: { city: string; background?: string };
    Settings: {
        locationCondition: string; locationIsNight: boolean;
        topCondition: string; topIsNight: boolean;
    };
};