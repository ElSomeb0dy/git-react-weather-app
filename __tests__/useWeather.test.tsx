import { renderHook, waitFor } from "@testing-library/react-native";
import { useWeather } from "../src/hooks/useWeather";
import * as api from "../src/services/openWeather";
import { mockWeather } from "./fixtures";

jest.mock("../src/services/openWeather");

describe("useWeather", () => {
    beforeEach(() => jest.clearAllMocks());

    it("starts in a loading state", () => {
        (api.fetchCurrentWeather as jest.Mock).mockReturnValue(new Promise(() => {}));
        const { result } = renderHook(() => useWeather("Paris"));
        expect(result.current.loading).toBe(true);
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it("returns data and clears loading on success", async () => {
        (api.fetchCurrentWeather as jest.Mock).mockResolvedValue(mockWeather);
        const { result } = renderHook(() => useWeather("Paris"));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.data).toEqual(mockWeather);
        expect(result.current.error).toBeNull();
    });

    it("returns error message and clears loading on failure", async () => {
        (api.fetchCurrentWeather as jest.Mock).mockRejectedValue(new Error("City not found"));
        const { result } = renderHook(() => useWeather("NopeTown"));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.data).toBeNull();
        expect(result.current.error).toBe("City not found");
    });

    it("refetches when city changes", async () => {
        (api.fetchCurrentWeather as jest.Mock).mockResolvedValue(mockWeather);
        const { rerender } = renderHook(({ city }: { city: string }) => useWeather(city), {
            initialProps: { city: "Paris" },
        });

        await waitFor(() =>
            expect(api.fetchCurrentWeather).toHaveBeenCalledWith("Paris")
        );

        rerender({ city: "London" });

        await waitFor(() =>
            expect(api.fetchCurrentWeather).toHaveBeenCalledWith("London")
        );

        expect(api.fetchCurrentWeather).toHaveBeenCalledTimes(2);
    });
});
