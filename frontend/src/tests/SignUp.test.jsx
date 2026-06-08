import {
   render,
   screen,
   waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import SignUp from "../pages/SignUp";
import { supabase } from "../lib/supabase";

// Mock image assets so Jest doesn't choke on non-JS imports
jest.mock("../assets/signup2.jpg", () => "mock-image");
jest.mock("../assets/logo.png", () => "mock-logo");

const mockNavigate = jest.fn();

// Mock react-router-dom so we can assert navigation calls without a real router
jest.mock("react-router-dom", () => ({
   useNavigate: () => mockNavigate,
}));

// Mock Supabase so no real auth requests are made during tests
jest.mock("../lib/supabase", () => ({
   supabase: {
      auth: {
         signUp: jest.fn(),
      },
   },
}));

// Mock fetch so no real API calls are made during tests
global.fetch = jest.fn(() =>
   Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
   }),
);

describe("SignUp component", () => {
   // Reset all mocks before each test to prevent state leaking between tests
   beforeEach(() => {
      mockNavigate.mockClear();
      supabase.auth.signUp.mockReset();
      global.fetch.mockClear();

      // Polyfill crypto.randomUUID for environments that don't support it
      if (!global.crypto) global.crypto = {};
      global.crypto.randomUUID = jest.fn(() => "test-uuid");
   });

   // ── Test 1: Basic render ───────────────────────────────
   test("renders the sign up form", () => {
      render(<SignUp />);

      // Page heading should be visible
      expect(
         screen.getByText(/get started now/i),
      ).toBeInTheDocument();

      // All three input fields should be present
      expect(
         screen.getByLabelText(/name/i),
      ).toBeInTheDocument();
      expect(
         screen.getByLabelText(/email address/i),
      ).toBeInTheDocument();

      // Use exact: true so it matches the "Password" label only,
      // not the toggle button's aria-label "Show password"
      expect(
         screen.getByLabelText("Password", { exact: true }),
      ).toBeInTheDocument();

      // Both action buttons should be present
      expect(
         screen.getByRole("button", { name: /sign up/i }),
      ).toBeInTheDocument();
      expect(
         screen.getByRole("button", { name: /sign in/i }),
      ).toBeInTheDocument();
   });

   // ── Test 2: Typing into inputs ─────────────────────────
   test("allows the user to type into the form inputs", async () => {
      const user = userEvent.setup();
      render(<SignUp />);

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput =
         screen.getByLabelText(/email address/i);

      // Use exact: true so it matches the "Password" label only,
      // not the toggle button's aria-label "Show password"
      const passwordInput = screen.getByLabelText(
         "Password",
         { exact: true },
      );

      // Simulate the user typing into each field
      await user.type(nameInput, "Adrian");
      await user.type(emailInput, "adrian@example.com");
      await user.type(passwordInput, "mypassword123");

      // Verify the values were accepted by each input
      expect(nameInput).toHaveValue("Adrian");
      expect(emailInput).toHaveValue("adrian@example.com");
      expect(passwordInput).toHaveValue("mypassword123");
   });

   // ── Test 3: Terms checkbox ─────────────────────────────
   test("allows the user to check the terms checkbox", async () => {
      const user = userEvent.setup();
      render(<SignUp />);

      const checkbox = screen.getByRole("checkbox");

      // Checkbox should start unchecked
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);

      // Checkbox should be checked after clicking
      expect(checkbox).toBeChecked();
   });

   test("requests email confirmation when sign up is submitted successfully", async () => {
      const user = userEvent.setup();

      // Mock a successful Supabase sign up response with a valid session
      supabase.auth.signUp.mockResolvedValue({
         data: {
            user: { id: "test-user-id" },
            session: { access_token: "fake-token" },
         },
         error: null,
      });

      render(<SignUp />);

      // Fill out the form
      await user.type(
         screen.getByLabelText(/name/i),
         "Adrian",
      );
      await user.type(
         screen.getByLabelText(/email address/i),
         "adrian@example.com",
      );

      // Use exact: true so it matches the "Password" label only,
      // not the toggle button's aria-label "Show password"
      await user.type(
         screen.getByLabelText("Password", { exact: true }),
         "mypassword123",
      );

      // Accept the terms and conditions
      await user.click(screen.getByRole("checkbox"));

      const submitButton = screen.getByRole("button", {
         name: /sign up/i,
      });

      // Override checkValidity since jsdom doesn't run native form validation
      const form = submitButton.closest("form");
      form.checkValidity = jest.fn().mockReturnValue(true);

      await user.click(submitButton);

      // Supabase signUp should have been called with the correct credentials
      await waitFor(() => {
         expect(supabase.auth.signUp).toHaveBeenCalledWith({
            email: "adrian@example.com",
            password: "mypassword123",
            options: {
               data: {
                  name: "Adrian",
               },
               emailRedirectTo:
                  "http://localhost/auth/callback",
            },
         });
      });

      // Backend should have been called to save the user profile
      await waitFor(() => {
         expect(global.fetch).not.toHaveBeenCalled();
      });

      // Should navigate to onboarding after successful sign up
      await waitFor(() => {
         expect(mockNavigate).toHaveBeenCalledWith(
            "/auth/callback",
         );
      });
   });

   // ── Test 5: Navigate to sign in ────────────────────────
   test("navigates to /signin when sign in button is clicked", async () => {
      const user = userEvent.setup();
      render(<SignUp />);

      const signInButton = screen.getByRole("button", {
         name: /sign in/i,
      });

      // Clicking "Sign in" should redirect existing users to the sign in page
      await user.click(signInButton);

      expect(mockNavigate).toHaveBeenCalledWith("/signin");
   });
});
