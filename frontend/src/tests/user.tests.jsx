import { describe, test } from "@jest/globals";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import UserPage from "../pages/User.jsx";

describe("User Profile Page", () => {
   test("renders the user page", () => {
      render(<UserPage />);
   });
});
