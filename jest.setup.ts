// jest.setup.ts

// Mock expo-constants (your API reads from Constants.expoConfig.extra)
jest.mock("expo-constants", () => ({
    expoConfig: { extra: { OPENWEATHER_API_KEY: "test-key" } },
}));

jest.mock("expo-secure-store", () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

jest.mock("@react-native-async-storage/async-storage", () =>
    require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);