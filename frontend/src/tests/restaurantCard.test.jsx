import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import RestaurantCard from "../components/RestaurantCard";

describe("RestaurantCard component", () => {
   const mockRestaurant = {
      name: "Shake Smart",
      image: "/images/shake-smart.jpg",
      avg_rating: 4.5,
      location: "UU Plaza",
      isBookmarked: false,
   };

   test("renders restaurant name, image, and location", () => {
      render(
         <RestaurantCard restaurant={mockRestaurant} />,
      );

      expect(
         screen.getByText(/shake smart/i),
      ).toBeInTheDocument();
      expect(
         screen.getByAltText(/shake smart/i),
      ).toBeInTheDocument();
      expect(
         screen.getByText(/uu plaza/i),
      ).toBeInTheDocument();
   });

   test("renders bookmark button with correct label when not bookmarked", () => {
      render(
         <RestaurantCard restaurant={mockRestaurant} />,
      );

      expect(
         screen.getByRole("button", {
            name: /bookmark shake smart/i,
         }),
      ).toBeInTheDocument();
   });

   test("toggles bookmark label in uncontrolled mode when clicked", async () => {
      const user = userEvent.setup();
      render(
         <RestaurantCard restaurant={mockRestaurant} />,
      );

      const bookmarkButton = screen.getByRole("button", {
         name: /bookmark shake smart/i,
      });

      await user.click(bookmarkButton);

      expect(
         screen.getByRole("button", {
            name: /remove bookmark for shake smart/i,
         }),
      ).toBeInTheDocument();
   });

   test("calls onToggle when bookmark button is clicked", async () => {
      const user = userEvent.setup();
      const onToggle = jest.fn();

      render(
         <RestaurantCard
            restaurant={mockRestaurant}
            onToggle={onToggle}
         />,
      );

      const bookmarkButton = screen.getByRole("button", {
         name: /bookmark shake smart/i,
      });

      await user.click(bookmarkButton);

      expect(onToggle).toHaveBeenCalledTimes(1);
   });

   test("respects controlled bookmarked state", () => {
      render(
         <RestaurantCard
            restaurant={mockRestaurant}
            isBookmarked={true}
         />,
      );

      expect(
         screen.getByRole("button", {
            name: /remove bookmark for shake smart/i,
         }),
      ).toBeInTheDocument();
   });

   test("does not render location when restaurant has no location", () => {
      const restaurantWithoutLocation = {
         ...mockRestaurant,
         location: "",
      };

      render(
         <RestaurantCard
            restaurant={restaurantWithoutLocation}
         />,
      );

      expect(
         screen.queryByText(/uu plaza/i),
      ).not.toBeInTheDocument();
   });

   test("renders five stars", () => {
      const { container } = render(
         <RestaurantCard restaurant={mockRestaurant} />,
      );

      const stars = container.querySelectorAll(".star");
      expect(stars).toHaveLength(5);
   });
});
