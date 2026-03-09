import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import LoginScreen from "../src/screens/LoginScreen";

jest.mock("../src/services/supabase", () => ({
    supabase: {
        auth: {
            signInWithPassword: jest.fn(),
            signUp: jest.fn(),
            resetPasswordForEmail: jest.fn(),
        },
    },
}));

import { supabase } from "../src/services/supabase";

const navigation: any = { reset: jest.fn() };

describe("LoginScreen", () => {
    beforeEach(() => jest.clearAllMocks());

    it("shows validation error for invalid email", () => {
        const { getByPlaceholderText, getByText, queryByText } = render(
            <LoginScreen navigation={navigation} route={{} as any} />
        );
        fireEvent.changeText(getByPlaceholderText("Email"), "not-an-email");
        fireEvent.changeText(getByPlaceholderText("Password"), "123456");
        fireEvent.press(getByText("Log in"));

        expect(queryByText("Please enter a valid email.")).toBeTruthy();
        expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it("shows validation error for short password", () => {
        const { getByPlaceholderText, getByText, queryByText } = render(
            <LoginScreen navigation={navigation} route={{} as any} />
        );
        fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
        fireEvent.changeText(getByPlaceholderText("Password"), "123");
        fireEvent.press(getByText("Log in"));

        expect(queryByText("Password must be at least 6 characters.")).toBeTruthy();
        expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it("navigates to Home on successful login", async () => {
        (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
            data: { session: {} },
            error: null,
        });

        const { getByPlaceholderText, getByText } = render(
            <LoginScreen navigation={navigation} route={{} as any} />
        );
        fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
        fireEvent.changeText(getByPlaceholderText("Password"), "123456");
        fireEvent.press(getByText("Log in"));

        await waitFor(() =>
            expect(navigation.reset).toHaveBeenCalledWith({
                index: 0,
                routes: [{ name: "Home" }],
            })
        );
    });

    it("shows incorrect credentials error from Supabase", async () => {
        (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
            data: null,
            error: { message: "Invalid login credentials" },
        });

        const { getByPlaceholderText, getByText, findByText } = render(
            <LoginScreen navigation={navigation} route={{} as any} />
        );
        fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
        fireEvent.changeText(getByPlaceholderText("Password"), "123456");
        fireEvent.press(getByText("Log in"));

        expect(await findByText("Incorrect email or password.")).toBeTruthy();
        expect(navigation.reset).not.toHaveBeenCalled();
    });

    it("shows generic Supabase error message", async () => {
        (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
            data: null,
            error: { message: "Too many requests" },
        });

        const { getByPlaceholderText, getByText, findByText } = render(
            <LoginScreen navigation={navigation} route={{} as any} />
        );
        fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
        fireEvent.changeText(getByPlaceholderText("Password"), "123456");
        fireEvent.press(getByText("Log in"));

        expect(await findByText("Too many requests")).toBeTruthy();
    });

    it("shows success message after account creation", async () => {
        (supabase.auth.signUp as jest.Mock).mockResolvedValue({ error: null });

        const { getByPlaceholderText, getByText, findByText } = render(
            <LoginScreen navigation={navigation} route={{} as any} />
        );
        fireEvent.changeText(getByPlaceholderText("Email"), "new@example.com");
        fireEvent.changeText(getByPlaceholderText("Password"), "123456");
        fireEvent.press(getByText("Create account"));

        expect(await findByText("Account created. You can now log in.")).toBeTruthy();
    });

    it("shows error when forgot password is pressed without email", () => {
        const { getByText, queryByText } = render(
            <LoginScreen navigation={navigation} route={{} as any} />
        );
        fireEvent.press(getByText("Forgot password?"));

        expect(queryByText("Enter your email first, then tap Forgot password.")).toBeTruthy();
    });
});
