import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ReviewCard from "../components/reviewCard";

jest.mock("../components/userName.jsx", () => {
   return function MockUserName({ name, is_verified }) {
      return (
         <div>
            <span>{name}</span>
            {is_verified && <span>Verified</span>}
         </div>
      );
   };
});

beforeAll(() => {
   global.IntersectionObserver = class {
      constructor() {}
      observe() {}
      disconnect() {}
      unobserve() {}
   };

   global.requestAnimationFrame = (cb) => cb();
   global.cancelAnimationFrame = jest.fn();
});

describe("ReviewCard component", () => {
   const mockReview = {
      userName: "Adrian",
      avatar_url: "https://example.com/avatar.jpg",
      is_verified: true,
      rating: 4,
      date: "2026-03-01",
      comments: "Really good food and quick service.",
      tags: [
         "Fast",
         "Fresh",
         "Friendly",
         "Clean",
         "Affordable",
         "Popular",
      ],
      photos: [
         "https://example.com/photo1.jpg",
         {
            url: "https://example.com/photo2.jpg",
            alt: "Second photo",
         },
      ],
   };

   test("renders nothing when review is empty", () => {
      const { container } = render(
         <ReviewCard review={{}} />,
      );
      expect(container.firstChild).toBeNull();
   });

   test("renders username, avatar, and comments", () => {
      render(<ReviewCard review={mockReview} />);

      expect(
         screen.getByText("Adrian"),
      ).toBeInTheDocument();
      expect(
         screen.getByAltText("Adrian's profile picture"),
      ).toBeInTheDocument();
      expect(
         screen.getByText(
            /really good food and quick service/i,
         ),
      ).toBeInTheDocument();
   });

   test("renders fallback avatar when avatar_url is missing", () => {
      const reviewWithoutAvatar = {
         ...mockReview,
         avatar_url: "",
      };

      render(<ReviewCard review={reviewWithoutAvatar} />);

      const avatar = screen.getByAltText(
         "Adrian's profile picture",
      );
      expect(avatar).toHaveAttribute(
         "src",
         "https://via.placeholder.com/48",
      );
   });

   test("renders the correct number of filled stars", () => {
      const { container } = render(
         <ReviewCard review={mockReview} />,
      );
      const filledStars =
         container.querySelectorAll(".star.filled");
      expect(filledStars).toHaveLength(4);
   });

   test("formats and displays the date", () => {
      render(<ReviewCard review={mockReview} />);
      expect(
         screen.getByText("Feb. 28 2026"),
      ).toBeInTheDocument();
   });

   test("renders first 5 tags by default and shows extra tag button", () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByText("Fast")).toBeInTheDocument();
      expect(screen.getByText("Fresh")).toBeInTheDocument();
      expect(
         screen.getByText("Friendly"),
      ).toBeInTheDocument();
      expect(screen.getByText("Clean")).toBeInTheDocument();
      expect(
         screen.getByText("Affordable"),
      ).toBeInTheDocument();

      expect(
         screen.queryByText("Popular"),
      ).not.toBeInTheDocument();
      expect(
         screen.getByRole("button", { name: /\+1 more/i }),
      ).toBeInTheDocument();
   });

   test("expands tags when +N more is clicked", async () => {
      const user = userEvent.setup();
      render(<ReviewCard review={mockReview} />);

      const moreButton = screen.getByRole("button", {
         name: /\+1 more/i,
      });
      await user.click(moreButton);

      expect(
         screen.getByText("Popular"),
      ).toBeInTheDocument();
      expect(
         screen.getByRole("button", { name: /show less/i }),
      ).toBeInTheDocument();
   });

   test("renders review photos", () => {
      render(<ReviewCard review={mockReview} />);

      expect(
         screen.getByAltText("Review photo 1"),
      ).toBeInTheDocument();
      expect(
         screen.getByAltText("Second photo"),
      ).toBeInTheDocument();
   });
});
