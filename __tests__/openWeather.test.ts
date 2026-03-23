import {
  fetchCurrentWeather,
  fetchCurrentWeatherByCoords,
  fetchCitySuggestions,
} from "../src/services/openWeather";
import { mockApiResponse } from "./fixtures";

const mockFetch = jest.fn();
global.fetch = mockFetch;

const ok = (body: object) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response);

const notOk = (status: number, text: string) =>
  Promise.resolve({ ok: false, status, text: () => Promise.resolve(text) } as Response);

describe("fetchCurrentWeather", () => {
  beforeEach(() => mockFetch.mockReset());

  it("parses a successful response into a CurrentWeather object", async () => {
    mockFetch.mockReturnValue(ok(mockApiResponse));
    const result = await fetchCurrentWeather("Paris");

    expect(result.city).toBe("Paris");
    expect(result.country).toBe("FR");
    expect(result.tempC).toBe(10);
    expect(result.tempF).toBe(50);
    expect(result.feelsLikeC).toBe(8);
    expect(result.condition).toBe("Clouds");
    expect(result.humidity).toBe(70);
    expect(result.windSpeed).toBe(3.5);
    expect(result.pressure).toBe(1013);
    expect(result.visibility).toBe(10000);
  });

  it("capitalizes each word in the description", async () => {
    mockFetch.mockReturnValue(ok(mockApiResponse));
    const result = await fetchCurrentWeather("Paris");
    expect(result.description).toBe("Overcast Clouds");
  });

  it("converts sunrise/sunset from Unix seconds to ms", async () => {
    mockFetch.mockReturnValue(ok(mockApiResponse));
    const result = await fetchCurrentWeather("Paris");
    expect(result.sunrise).toBe(mockApiResponse.sys.sunrise * 1000);
    expect(result.sunset).toBe(mockApiResponse.sys.sunset * 1000);
  });

  it("sets sunrise/sunset to null when missing from response", async () => {
    const noSun = { ...mockApiResponse, sys: { country: "FR" } };
    mockFetch.mockReturnValue(ok(noSun));
    const result = await fetchCurrentWeather("Paris");
    expect(result.sunrise).toBeNull();
    expect(result.sunset).toBeNull();
  });

  it("defaults visibility to 0 when missing", async () => {
    const noVis = { ...mockApiResponse, visibility: undefined };
    mockFetch.mockReturnValue(ok(noVis));
    const result = await fetchCurrentWeather("Paris");
    expect(result.visibility).toBe(0);
  });

  it("defaults icon to '01d' when missing", async () => {
    const noIcon = { ...mockApiResponse, weather: [{ main: "Clear", description: "clear sky" }] };
    mockFetch.mockReturnValue(ok(noIcon));
    const result = await fetchCurrentWeather("Paris");
    expect(result.icon).toBe("01d");
  });

  it("throws on a non-ok HTTP response", async () => {
    mockFetch.mockReturnValue(notOk(404, "city not found"));
    await expect(fetchCurrentWeather("NopeTown")).rejects.toThrow("404");
  });

  it("includes the city name in the URL", async () => {
    mockFetch.mockReturnValue(ok(mockApiResponse));
    await fetchCurrentWeather("Tokyo");
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("q=Tokyo"));
  });
});

describe("fetchCurrentWeatherByCoords", () => {
  beforeEach(() => mockFetch.mockReset());

  it("parses a successful response into a CurrentWeather object", async () => {
    mockFetch.mockReturnValue(ok(mockApiResponse));
    const result = await fetchCurrentWeatherByCoords(48.85, 2.35);

    expect(result.city).toBe("Paris");
    expect(result.tempC).toBe(10);
    expect(result.feelsLikeC).toBe(8);
  });

  it("includes lat/lon in the URL", async () => {
    mockFetch.mockReturnValue(ok(mockApiResponse));
    await fetchCurrentWeatherByCoords(48.85, 2.35);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("lat=48.85"));
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("lon=2.35"));
  });

  it("throws on a non-ok HTTP response", async () => {
    mockFetch.mockReturnValue(notOk(500, "server error"));
    await expect(fetchCurrentWeatherByCoords(0, 0)).rejects.toThrow("500");
  });
});

describe("fetchCitySuggestions", () => {
  beforeEach(() => mockFetch.mockReset());

  it("returns empty array for empty query without fetching", async () => {
    const result = await fetchCitySuggestions("");
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("returns empty array for whitespace-only query", async () => {
    const result = await fetchCitySuggestions("   ");
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("returns parsed suggestions on success", async () => {
    mockFetch.mockReturnValue(
      ok([{ name: "Paris", country: "FR", state: "Île-de-France", lat: 48.85, lon: 2.35 }])
    );
    const results = await fetchCitySuggestions("Paris");
    expect(results).toHaveLength(1);
    expect(results[0].label).toBe("Paris, Île-de-France, FR");
    expect(results[0].name).toBe("Paris");
    expect(results[0].country).toBe("FR");
  });

  it("deduplicates results with the same label", async () => {
    mockFetch.mockReturnValue(
      ok([
        { name: "Paris", country: "FR", lat: 48.85, lon: 2.35 },
        { name: "Paris", country: "FR", lat: 49.0, lon: 2.5 },
      ])
    );
    const results = await fetchCitySuggestions("Paris");
    expect(results).toHaveLength(1);
  });

  it("deduplicates results with the same coordinates", async () => {
    mockFetch.mockReturnValue(
      ok([
        { name: "Paris", country: "FR", lat: 48.85, lon: 2.35 },
        { name: "Paris 1er", country: "FR", lat: 48.85, lon: 2.35 },
      ])
    );
    const results = await fetchCitySuggestions("Paris");
    expect(results).toHaveLength(1);
  });

  it("returns empty array when API returns non-array", async () => {
    mockFetch.mockReturnValue(ok({ error: "bad request" }));
    const results = await fetchCitySuggestions("???");
    expect(results).toEqual([]);
  });

  it("returns empty array on non-ok response", async () => {
    mockFetch.mockReturnValue(notOk(400, "bad request"));
    const results = await fetchCitySuggestions("Paris");
    expect(results).toEqual([]);
  });
});
