import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import SignUp from "../pages/SignUp";

jest.mock("../assets/signup2.jpg", () => "mock-image");

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
   useNavigate: () => mockNavigate,
}));

describe("SignUp component", () => {
   beforeEach(() => {
      mockNavigate.mockClear();
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

   test("does not navigate when sign up is submitted", async () => {
      const user = userEvent.setup();
      render(<SignUp />);

      const submitButton = screen.getByRole("button", {
         name: /sign up/i,
      });

      await user.click(submitButton);

      expect(mockNavigate).not.toHaveBeenCalled();
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
