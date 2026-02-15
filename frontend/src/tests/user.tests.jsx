import { describe, test, expect } from "@jest/globals";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import UserPage from "../pages/User.jsx";

describe("User Profile Page", () => {
   test("renders the user page", () => {
      render(<UserPage />);

      // check for Header elements
      const logoElement = document.querySelector(".logo");
      expect(logoElement).toBeInTheDocument();
      const accountIcon = document.querySelector(
         ".user-header svg",
      );
      expect(accountIcon).toBeInTheDocument();

      // check for user info elements
      const profilePicture = document.querySelector(
         ".user-profile-picture",
      );
      expect(profilePicture).toBeInTheDocument();
      const userName = document.querySelector(".name h3");
      expect(userName).toHaveTextContent("Eli Schiffler");

      // check for review card elements
      const reviewCard =
         document.querySelector(".review-card");
      expect(reviewCard).toBeInTheDocument();
      const reviewUserName = reviewCard.querySelector(
         ".review-user-name",
      );
      expect(reviewUserName).toHaveTextContent(
         "Eli Schiffler",
      );
      const reviewComments = reviewCard.querySelector(
         ".review-comments",
      );
      expect(reviewComments).toHaveTextContent("Loved it!");
   });

   // check for saved restaurant elements
   test("renders saved restaurants", () => {
      render(<UserPage />);
      const restaurantCards = document.querySelectorAll(
         ".restaurant-card",
      );
      expect(restaurantCards.length).toBe(3);
   });
});
