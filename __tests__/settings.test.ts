import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadSettings, saveSettings } from "../src/storage/settings";

describe("loadSettings", () => {
    beforeEach(() => (AsyncStorage.getItem as jest.Mock).mockReset());

    it("returns default settings when nothing is stored", async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
        const settings = await loadSettings();
        expect(settings).toEqual({ unit: "C", homeTheme: "top", fixedTheme: "Clouds" });
    });

    it("returns stored settings when present", async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({ unit: "F" }));
        const settings = await loadSettings();
        expect(settings.unit).toBe("F");
    });

    it("merges stored settings with defaults (handles partial saves)", async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({}));
        const settings = await loadSettings();
        expect(settings).toEqual({ unit: "C", homeTheme: "top", fixedTheme: "Clouds" });
    });

    it("returns defaults when stored JSON is corrupt", async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue("not-valid-json{{");
        const settings = await loadSettings();
        expect(settings).toEqual({ unit: "C", homeTheme: "top", fixedTheme: "Clouds" });
    });
});

describe("saveSettings", () => {
    beforeEach(() => (AsyncStorage.setItem as jest.Mock).mockReset());

    it("serializes and writes settings to AsyncStorage", async () => {
        (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
        await saveSettings({ unit: "F" });
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            expect.any(String),
            JSON.stringify({ unit: "F" })
        );
    });
});
