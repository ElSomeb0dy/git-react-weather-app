import { tempColor } from "../src/utils/tempColor";

describe("tempColor", () => {
    it("returns blue for freezing temperatures (< 0)", () => {
        expect(tempColor(-10)).toBe("#60A5FA");
        expect(tempColor(-0.1)).toBe("#60A5FA");
    });

    it("returns light blue for cold temperatures (0–9)", () => {
        expect(tempColor(0)).toBe("#93C5FD");
        expect(tempColor(9.9)).toBe("#93C5FD");
    });

    it("returns green for cool temperatures (10–17)", () => {
        expect(tempColor(10)).toBe("#34D399");
        expect(tempColor(17.9)).toBe("#34D399");
    });

    it("returns yellow for mild temperatures (18–23)", () => {
        expect(tempColor(18)).toBe("#FBBF24");
        expect(tempColor(23.9)).toBe("#FBBF24");
    });

    it("returns orange for warm temperatures (24–29)", () => {
        expect(tempColor(24)).toBe("#F97316");
        expect(tempColor(29.9)).toBe("#F97316");
    });

    it("returns red for hot temperatures (30+)", () => {
        expect(tempColor(30)).toBe("#EF4444");
        expect(tempColor(45)).toBe("#EF4444");
    });
});
