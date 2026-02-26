import "../test-setup.js";

import { describe, test, expect } from "@jest/globals";
import {
   render,
   screen,
   fireEvent,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import Header from "../components/header.jsx";

describe("Global Header Component", () => {
   // Verify the component renders the main container
   test("renders the header container", () => {
      render(
         <BrowserRouter>
            <Header />
         </BrowserRouter>,
      );
      const headerElement =
         document.querySelector(".app-header");
      expect(headerElement).toBeInTheDocument();
   });

   // Verify the Logo is present and contains the correct text
   test("renders the application logo", () => {
      render(
         <BrowserRouter>
            <Header />
         </BrowserRouter>,
      );
      // The Logo is now an image
      const logoImage = screen.getByRole("img", {
         name: /umami logo/i,
      });
      expect(logoImage).toBeInTheDocument();
   });

   // Verify the Account Icon is present
   test("renders the account profile icon", () => {
      render(
         <BrowserRouter>
            <Header />
         </BrowserRouter>,
      );
      // The icon is rendered as an SVG by react-icons
      const iconSvg = document.querySelector(
         ".app-header svg",
      );
      expect(iconSvg).toBeInTheDocument();
   });

   // Verify dropdown toggles
   test("toggles dropdown menu on account icon click", () => {
      render(
         <BrowserRouter>
            <Header />
         </BrowserRouter>,
      );
      const iconSvg =
         document.querySelector(".profile-icon");

      // Dropdown should not be visible initially
      expect(
         screen.queryByText("My Account"),
      ).not.toBeInTheDocument();

      // Click icon to open
      fireEvent.click(iconSvg);
      expect(
         screen.getByText("My Account"),
      ).toBeInTheDocument();
      expect(
         screen.getByText("Sign Out"),
      ).toBeInTheDocument();
   });
});
