import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import LoginScreen from "../src/screens/LoginScreen";

// Mock supabase module used by LoginScreen
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

describe("LoginScreen (Supabase)", () => {
    const navigation: any = { replace: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("shows validation message for invalid email", () => {
        const { getByPlaceholderText, getByText, queryByText } = render(
            <LoginScreen navigation={navigation} route={{} as any} />
        );

        fireEvent.changeText(getByPlaceholderText("Email"), "not-an-email");
        fireEvent.changeText(getByPlaceholderText("Password"), "123456");
        fireEvent.press(getByText("Log in"));

        expect(queryByText("Please enter a valid email.")).toBeTruthy();
        expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it("logs in and navigates to Home on success", async () => {
        (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
            data: { session: { access_token: "x" } },
            error: null,
        });

        const { getByPlaceholderText, getByText } = render(
            <LoginScreen navigation={navigation} route={{} as any} />
        );

        fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
        fireEvent.changeText(getByPlaceholderText("Password"), "123456");
        fireEvent.press(getByText("Log in"));

        await waitFor(() => {
            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: "test@example.com",
                password: "123456",
            });
            expect(navigation.replace).toHaveBeenCalledWith("Home");
        });
    });

    it('shows "Incorrect email or password." when Supabase returns invalid credentials', async () => {
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
        expect(navigation.replace).not.toHaveBeenCalled();
    });
});