import { themeForCondition } from "../src/theme/weatherTheme";

describe("themeForCondition", () => {
  it("returns a theme with all required fields for every condition", () => {
    const conditions = ["Clear", "Rain", "Snow", "Clouds", "Thunderstorm"] as const;
    for (const c of conditions) {
      const theme = themeForCondition(c);
      expect(theme).toHaveProperty("background");
      expect(theme).toHaveProperty("card");
      expect(theme).toHaveProperty("text");
      expect(theme).toHaveProperty("subtleText");
      expect(theme).toHaveProperty("accent");
    }
  });

  it("falls back to the Clouds theme for unmapped conditions", () => {
    const fallback = themeForCondition("Mist");
    const clouds = themeForCondition("Clouds");
    expect(fallback.background).toBe(clouds.background);
    expect(fallback.accent).toBe(clouds.accent);
  });

  it("returns a different theme for each major condition", () => {
    const backgrounds = ["Clear", "Rain", "Snow", "Clouds", "Thunderstorm"].map(
      (c) => themeForCondition(c as any).background
    );
    const unique = new Set(backgrounds);
    expect(unique.size).toBe(5);
  });
});
