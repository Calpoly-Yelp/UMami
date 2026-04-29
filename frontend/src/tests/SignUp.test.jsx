import {
   render,
   screen,
   waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import SignUp from "../pages/SignUp";
import { supabase } from "../lib/supabase";

jest.mock("../assets/signup2.jpg", () => "mock-image");
jest.mock("../assets/logo.png", () => "mock-logo");

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
   useNavigate: () => mockNavigate,
}));

jest.mock("../lib/supabase", () => ({
   supabase: {
      auth: {
         signUp: jest.fn(),
      },
   },
}));

global.fetch = jest.fn(() =>
   Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
   }),
);

describe("SignUp component", () => {
   beforeEach(() => {
      mockNavigate.mockClear();
      supabase.auth.signUp.mockClear();
      global.fetch.mockClear();

      if (!global.crypto) global.crypto = {};
      global.crypto.randomUUID = jest.fn(() => "test-uuid");
   });

   test("renders the sign up form", () => {
      render(<SignUp />);

      expect(
         screen.getByText(/get started now/i),
      ).toBeInTheDocument();

      expect(
         screen.getByLabelText(/name/i),
      ).toBeInTheDocument();
      expect(
         screen.getByLabelText(/email address/i),
      ).toBeInTheDocument();
      expect(
         screen.getByLabelText(/password/i),
      ).toBeInTheDocument();

      expect(
         screen.getByRole("button", { name: /sign up/i }),
      ).toBeInTheDocument();

      expect(
         screen.getByRole("button", { name: /sign in/i }),
      ).toBeInTheDocument();
   });

   test("allows the user to type into the form inputs", async () => {
      const user = userEvent.setup();
      render(<SignUp />);

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput =
         screen.getByLabelText(/email address/i);
      const passwordInput =
         screen.getByLabelText(/password/i);

      await user.type(nameInput, "Adrian");
      await user.type(emailInput, "adrian@example.com");
      await user.type(passwordInput, "mypassword123");

      expect(nameInput).toHaveValue("Adrian");
      expect(emailInput).toHaveValue("adrian@example.com");
      expect(passwordInput).toHaveValue("mypassword123");
   });

   test("allows the user to check the terms checkbox", async () => {
      const user = userEvent.setup();
      render(<SignUp />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);

      expect(checkbox).toBeChecked();
   });

   test("navigates to /onboarding when sign up is submitted successfully", async () => {
      const user = userEvent.setup();

      supabase.auth.signUp.mockResolvedValue({
         data: {
            user: { id: "test-user-id" },
            session: { access_token: "fake-token" },
         },
         error: null,
      });

      render(<SignUp />);

      await user.type(
         screen.getByLabelText(/name/i),
         "Adrian",
      );
      await user.type(
         screen.getByLabelText(/email address/i),
         "adrian@example.com",
      );
      await user.type(
         screen.getByLabelText(/password/i),
         "mypassword123",
      );
      await user.click(screen.getByRole("checkbox"));

      const submitButton = screen.getByRole("button", {
         name: /sign up/i,
      });

      const form = submitButton.closest("form");
      form.checkValidity = jest.fn().mockReturnValue(true);

      await user.click(submitButton);

      await waitFor(() => {
         expect(supabase.auth.signUp).toHaveBeenCalledWith({
            email: "adrian@example.com",
            password: "mypassword123",
            options: {
               data: {
                  name: "Adrian",
               },
            },
         });
      });

      await waitFor(() => {
         expect(global.fetch).toHaveBeenCalledWith(
            "http://localhost:4000/api/users",
            {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({
                  id: "test-user-id",
                  name: "Adrian",
                  email: "adrian@example.com",
                  avatar_url:
                     "https://ui-avatars.com/api/?name=Adrian",

                  is_verified: false,
               }),
            },
         );
      });

      await waitFor(() => {
         expect(mockNavigate).toHaveBeenCalledWith(
            "/onboarding",
         );
      });
   });

   test("navigates to /signin when sign in button is clicked", async () => {
      const user = userEvent.setup();
      render(<SignUp />);

      const signInButton = screen.getByRole("button", {
         name: /sign in/i,
      });

      await user.click(signInButton);

      expect(mockNavigate).toHaveBeenCalledWith("/signin");
   });
});
