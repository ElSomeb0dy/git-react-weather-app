import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import LoginScreen from "../src/screens/LoginScreen";
import * as auth from "../src/storage/auth";
import { Alert } from "react-native";

jest.mock("../src/storage/auth");

describe("LoginScreen", () => {
    const navigation: any = { replace: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("shows alert on invalid credentials", () => {
        const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

        const { getByPlaceholderText, getByText } = render(
            <LoginScreen navigation={navigation} route={{} as any} />
        );

        fireEvent.changeText(getByPlaceholderText("Email"), "not-an-email");
        fireEvent.changeText(getByPlaceholderText("Password"), "12");
        fireEvent.press(getByText("Login"));

        expect(alertSpy).toHaveBeenCalled();
    });

    it("stores session and navigates on valid login", async () => {
        (auth.setSession as jest.Mock).mockResolvedValue(undefined);

        const { getByPlaceholderText, getByText } = render(
            <LoginScreen navigation={navigation} route={{} as any} />
        );

        fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
        fireEvent.changeText(getByPlaceholderText("Password"), "1234");
        fireEvent.press(getByText("Login"));

        await waitFor(() => {
            expect(auth.setSession).toHaveBeenCalledWith("test@example.com");
            expect(navigation.replace).toHaveBeenCalledWith("Home");
        });
    });
});