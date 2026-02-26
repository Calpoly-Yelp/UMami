import { describe, test, expect } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Header from "../components/header.jsx";

describe("Global Header Component", () => {
   // Verify the component renders the main container
   test("renders the header container", () => {
      render(<Header />);
      const headerElement =
         document.querySelector(".app-header");
      expect(headerElement).toBeInTheDocument();
   });

   // Verify the Logo is present and contains the correct text
   test("renders the application logo", () => {
      render(<Header />);
      // The Logo component uses an <h1> tag
      const logoHeading = screen.getByRole("heading", {
         level: 1,
      });
      expect(logoHeading).toBeInTheDocument();
      expect(logoHeading).toHaveTextContent("umami");
   });

   // Verify the Account Icon is present
   test("renders the account profile icon", () => {
      render(<Header />);
      // The icon is rendered as an SVG by react-icons
      const iconSvg = document.querySelector(
         ".app-header svg",
      );
      expect(iconSvg).toBeInTheDocument();
   });
});
