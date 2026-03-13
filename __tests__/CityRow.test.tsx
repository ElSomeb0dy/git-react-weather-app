import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CityRow from "../src/components/CityRow";
import { mockWeather } from "./fixtures";

const baseProps = {
    city: "Paris",
    unit: "C" as const,
    cardColor: "#fff",
    textColor: "#000",
    onOpen: jest.fn(),
    onRemove: jest.fn(),
};

describe("CityRow", () => {
    beforeEach(() => jest.clearAllMocks());

    it("shows the raw city string when no weather is loaded yet", () => {
        const { getByText } = render(<CityRow {...baseProps} />);
        expect(getByText("Paris")).toBeTruthy();
    });

    it("shows city and country from weather data once loaded", () => {
        const { getByText } = render(<CityRow {...baseProps} weather={mockWeather} />);
        expect(getByText("Paris, FR")).toBeTruthy();
    });

    it("shows temperature in Celsius when unit is C", () => {
        const { getByText } = render(<CityRow {...baseProps} weather={mockWeather} />);
        expect(getByText("10°")).toBeTruthy();
    });

    it("shows temperature in Fahrenheit when unit is F", () => {
        const { getByText } = render(<CityRow {...baseProps} unit="F" weather={mockWeather} />);
        expect(getByText("50°")).toBeTruthy();
    });

    it("calls onOpen when the row is pressed", () => {
        const { getByTestId } = render(<CityRow {...baseProps} weather={mockWeather} />);
        fireEvent.press(getByTestId("city-row"));
        expect(baseProps.onOpen).toHaveBeenCalledTimes(1);
    });

    it("calls onRemove when the swipe remove button is pressed", () => {
        const { getByTestId } = render(<CityRow {...baseProps} weather={mockWeather} />);
        fireEvent.press(getByTestId("remove-city"));
        expect(baseProps.onRemove).toHaveBeenCalledTimes(1);
    });
});
