import "../test-setup.js";
import {
   describe,
   test,
   expect,
   beforeAll,
   beforeEach,
   jest,
} from "@jest/globals";
import {
   render as rtlRender,
   screen,
   fireEvent,
   waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import {
   MemoryRouter,
   Routes,
   Route,
} from "react-router-dom";
import RestaurantMenu from "../pages/RestaurantMenu.jsx";

// Custom render function that wraps components in MemoryRouter so React Router hooks work
const render = (ui, options) =>
   rtlRender(
      <MemoryRouter initialEntries={["/restaurant/1/menu"]}>
         <Routes>
            <Route
               path="/restaurant/:id/menu"
               element={ui}
            />
         </Routes>
      </MemoryRouter>,
      options,
   );

// --- Mock Data Setup ---
const mockRestaurant = {
   id: "1",
   name: "Shake Smart",
   image_urls: [
      "https://placehold.co/1200x400/003831/FFFFFF?text=Shake+Smart",
   ],
};

// --- Test Environment Setup ---
beforeAll(() => {
   global.fetch = jest.fn(() =>
      Promise.resolve({
         ok: true,
         json: () => Promise.resolve(mockRestaurant),
         status: 200,
      }),
   );

   // Mock scrollIntoView because jsdom doesn't support it natively
   window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
   jest.clearAllMocks();
});

describe("Restaurant Menu Page", () => {
   test("renders the restaurant menu page and fetches restaurant data", async () => {
      render(<RestaurantMenu />);
      expect(
         screen.getByText("Loading..."),
      ).toBeInTheDocument();

      await waitFor(() => {
         expect(
            screen.getByText("Shake Smart"),
         ).toBeInTheDocument();
      });
   });

   test("renders all menu categories in the sidebar", async () => {
      render(<RestaurantMenu />);
      await screen.findByText("Shake Smart");

      const expectedCategories = [
         "Signature Shakes",
         "Premium Shakes",
         "Acai Bowls",
         "Cold Brew Coffee",
         "Oatmeal & Yogurt",
         "Toast",
         "Extras",
      ];

      expectedCategories.forEach((category) => {
         expect(
            screen.getByText(category, { selector: "li" }),
         ).toBeInTheDocument();
      });
   });

   test("renders the menu items in the table structure", async () => {
      render(<RestaurantMenu />);
      await screen.findByText("Shake Smart");

      expect(
         screen.getByText("Acai Energy"),
      ).toBeInTheDocument();
      expect(
         screen.getByText("Avocado Toast"),
      ).toBeInTheDocument();
   });

   test("updates active category and scrolls when a sidebar link is clicked", async () => {
      render(<RestaurantMenu />);
      await screen.findByText("Shake Smart");

      const acaiBowlsLink = screen.getByText("Acai Bowls", {
         selector: "li",
      });

      fireEvent.click(acaiBowlsLink);

      expect(acaiBowlsLink).toHaveClass("is-active");
      expect(
         window.HTMLElement.prototype.scrollIntoView,
      ).toHaveBeenCalled();
   });

   test("opens and displays the nutrient modal when a menu item is clicked", async () => {
      render(<RestaurantMenu />);
      await screen.findByText("Shake Smart");

      // Click the Acai Energy row
      fireEvent.click(screen.getByText("Acai Energy"));

      // Assert modal content is displayed
      expect(
         screen.getByText("Total Fat"),
      ).toBeInTheDocument();
      expect(screen.getByText("8g")).toBeInTheDocument(); // Acai Energy fat
      expect(
         screen.getByText("Total Carbohydrates"),
      ).toBeInTheDocument();
      expect(screen.getByText("50g")).toBeInTheDocument();
      expect(
         screen.getByText("Protein"),
      ).toBeInTheDocument();
      expect(screen.getByText("20g")).toBeInTheDocument();

      // Test closing the modal
      const closeButton = screen.getByText("×");
      fireEvent.click(closeButton);

      // Wait for modal to disappear
      expect(
         screen.queryByText("Total Fat"),
      ).not.toBeInTheDocument();
   });
});

describe("Restaurant Menu Page Edge Cases", () => {
   test("displays Unknown Restaurant if the fetch request fails", async () => {
      const consoleSpy = jest
         .spyOn(console, "error")
         .mockImplementation(() => {});
      global.fetch.mockImplementationOnce(() =>
         Promise.reject(new Error("Network error")),
      );
      render(<RestaurantMenu />);

      await waitFor(() => {
         expect(
            screen.getByText("Unknown Restaurant"),
         ).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
   });
});
