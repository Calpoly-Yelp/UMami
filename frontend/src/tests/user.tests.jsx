import { describe, test, expect } from "@jest/globals";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import UserPage from "../pages/User.jsx";

describe("User Profile Page", () => {
   test("renders the user page", () => {
      render(<UserPage />);

      // check for UMami logo
      const logoElement = document.querySelector(".logo");
      expect(logoElement).toBeInTheDocument();
   });
});
