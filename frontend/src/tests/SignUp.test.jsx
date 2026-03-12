import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import SignUp from "../pages/SignUp";

jest.mock("../assets/signup2.jpg", () => "mock-image");

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
   useNavigate: () => mockNavigate,
}));

// Mock global fetch to isolate tests from network/backend
global.fetch = jest.fn(() =>
   Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
   }),
);

describe("SignUp component", () => {
   beforeEach(() => {
      mockNavigate.mockClear();
      global.fetch.mockClear();
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

      // Mock crypto.randomUUID for the component's internal logic
      if (!global.crypto) global.crypto = {};
      global.crypto.randomUUID = jest.fn(() => "test-uuid");

      render(<SignUp />);

      // Fill out required fields so the form is valid and submits
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

      expect(mockNavigate).toHaveBeenCalledWith(
         "/onboarding",
      );
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
