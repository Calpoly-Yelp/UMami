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

const mockMenu = [
   {
      category: "Signature Shakes",
      items: [
         {
            id: 1,
            name: "Acai Energy",
            portion: "24 oz",
            calories: 350,
            fat: "8g",
            carbs: "50g",
            protein: "20g",
         },
         {
            id: 2,
            name: "Perfect 10",
            portion: "24 oz",
            calories: 420,
            fat: "12g",
            carbs: "60g",
            protein: "30g",
         },
      ],
   },
   {
      category: "Acai Bowls",
      items: [
         {
            id: 3,
            name: "Traditional Acai",
            portion: "Bowl",
            calories: 550,
            fat: "15g",
            carbs: "90g",
            protein: "10g",
         },
      ],
   },
   {
      category: "Toast",
      items: [
         {
            id: 4,
            name: "Avocado Toast",
            portion: "1 slice",
            calories: 250,
            fat: "15g",
            carbs: "20g",
            protein: "6g",
         },
      ],
   },
];

// --- Test Environment Setup ---
beforeAll(() => {
   global.fetch = jest.fn();

   // Mock scrollIntoView because jsdom doesn't support it natively
   window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
   jest.clearAllMocks();
   global.fetch.mockImplementation((url) => {
      if (url.endsWith("/menu")) {
         return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockMenu),
            status: 200,
         });
      }

      return Promise.resolve({
         ok: true,
         json: () => Promise.resolve(mockRestaurant),
         status: 200,
      });
   });
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
      expect(global.fetch).toHaveBeenCalledWith(
         "http://localhost:4000/api/restaurants/1/menu",
      );
   });

   test("renders all menu categories in the sidebar", async () => {
      render(<RestaurantMenu />);
      await screen.findByText("Shake Smart");

      const expectedCategories = [
         "Signature Shakes",
         "Acai Bowls",
         "Toast",
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
      global.fetch.mockImplementation((url) => {
         if (url.endsWith("/menu")) {
            return Promise.resolve({
               ok: true,
               json: () => Promise.resolve(mockMenu),
               status: 200,
            });
         }

         return Promise.reject(new Error("Network error"));
      });
      render(<RestaurantMenu />);

      await waitFor(() => {
         expect(
            screen.getByText("Unknown Restaurant"),
         ).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
   });

   test("displays a message if menu fetch fails", async () => {
      const consoleSpy = jest
         .spyOn(console, "error")
         .mockImplementation(() => {});
      global.fetch.mockImplementation((url) => {
         if (url.endsWith("/menu")) {
            return Promise.reject(new Error("Menu error"));
         }

         return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockRestaurant),
            status: 200,
         });
      });

      render(<RestaurantMenu />);

      expect(
         await screen.findByText("Menu unavailable."),
      ).toBeInTheDocument();

      consoleSpy.mockRestore();
   });
});
