import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CityRow from "../src/components/CityRow";
import { CurrentWeather } from "../src/types/weather";

describe("CityRow", () => {
    it("renders city and loading text when no weather provided", () => {
        const { getByText } = render(
            <CityRow city="Paris" onOpen={() => {}} onRemove={() => {}} />
        );

        expect(getByText("Paris")).toBeTruthy();
        expect(getByText("Loading weather…")).toBeTruthy();
    });

    it("calls onRemove when remove is pressed", () => {
        const onRemove = jest.fn();

        const fakeWeather: CurrentWeather = {
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
        };

        const { getByTestId } = render(
            <CityRow
                city="Paris"
                weather={fakeWeather}
                onOpen={() => {}}
                onRemove={onRemove}
            />
        );

        fireEvent.press(getByTestId("remove-city"));
        expect(onRemove).toHaveBeenCalledTimes(1);
    });
});