import { describe, test, expect } from "@jest/globals";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import UserPage from "../pages/User.jsx";

describe("User Profile Page", () => {
   // checks to see if user page will render
   test("renders the user page", () => {
      render(<UserPage />);
   });

   // check for header elements
   test("renders header elements", () => {
      render(<UserPage />);
      const logoElement = document.querySelector(".logo");
      expect(logoElement).toBeInTheDocument();
      const accountIcon = document.querySelector(
         ".user-header svg",
      );
      expect(accountIcon).toBeInTheDocument();
   });

   // check for user info elements
   test("renders user info", () => {
      render(<UserPage />);
      const nameElement = document.querySelector(".name");
      expect(nameElement).toBeInTheDocument();
      const verifiedBadge = document.querySelector(
         ".verified-badge",
      );
      expect(verifiedBadge).toBeInTheDocument();
   });

   // check for review card elements
   test("renders review cards", () => {
      render(<UserPage />);
      const reviewCards =
         document.querySelectorAll(".review-card");
      expect(reviewCards.length).toBe(1);
   });

   // check for saved restaurant elements
   test("renders saved restaurants", () => {
      render(<UserPage />);
      const restaurantCards = document.querySelectorAll(
         ".restaurant-card",
      );
      expect(restaurantCards.length).toBe(3);
   });

   // check for followed user elements
   test("renders followed users", () => {
      render(<UserPage />);
      const followedUserCards = document.querySelectorAll(
         ".followed-user-card",
      );
      expect(followedUserCards.length).toBe(2);
   });
});
