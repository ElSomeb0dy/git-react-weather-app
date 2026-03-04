import { renderHook, waitFor } from "@testing-library/react-native";
import { useWeather } from "../src/hooks/useWeather";
import * as api from "../src/services/openWeather";

jest.mock("../src/services/openWeather");

describe("useWeather", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns data when fetch succeeds", async () => {
        (api.fetchCurrentWeather as jest.Mock).mockResolvedValue({
            city: "Paris",
            country: "FR",
            tempC: 10,
            tempF: 50,
            condition: "Clouds",
            description: "overcast clouds",
            icon: "04d",
            humidity: 70,
            windSpeed: 3,
            updatedAt: Date.now(),
        });

        const { result } = renderHook(() => useWeather("Paris"));

        // initial state
        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
            expect(result.current.data?.city).toBe("Paris");
        });
    });

    it("returns error when fetch fails", async () => {
        (api.fetchCurrentWeather as jest.Mock).mockRejectedValue(
            new Error("City not found")
        );

        const { result } = renderHook(() => useWeather("NopeTown"));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.data).toBeNull();
            expect(result.current.error).toContain("City not found");
        });
    });
});