import * as SecureStore from "expo-secure-store";
import { secureGet, secureSet, secureDelete } from "../src/storage/secure";

describe("secureGet / secureSet / secureDelete (native)", () => {
    beforeEach(() => {
        (SecureStore.getItemAsync as jest.Mock).mockReset();
        (SecureStore.setItemAsync as jest.Mock).mockReset();
        (SecureStore.deleteItemAsync as jest.Mock).mockReset();
    });

    it("secureGet delegates to SecureStore on native", async () => {
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("value");
        const result = await secureGet("key");
        expect(SecureStore.getItemAsync).toHaveBeenCalledWith("key");
        expect(result).toBe("value");
    });

    it("secureSet delegates to SecureStore on native", async () => {
        (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
        await secureSet("key", "value");
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith("key", "value");
    });

    it("secureDelete delegates to SecureStore on native", async () => {
        (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
        await secureDelete("key");
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("key");
    });
});
