import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import WriteReview from "../components/writeReview";

jest.mock("../components/modal", () => {
   return function MockModal({ open, children }) {
      return open ? (
         <div data-testid="modal">{children}</div>
      ) : null;
   };
});

jest.mock("../components/photoUpload", () => {
   return function MockPhotoUpload() {
      return <div>PhotoUpload</div>;
   };
});

describe("WriteReview component", () => {
   test("renders the title", () => {
      render(<WriteReview />);

      expect(
         screen.getByText(/shake smart review/i),
      ).toBeInTheDocument();
   });

   test("allows user to select a star rating", async () => {
      const user = userEvent.setup();
      render(<WriteReview />);

      const star3 = screen.getByRole("radio", {
         name: /3 stars/i,
      });
      await user.click(star3);

      expect(star3).toHaveAttribute("aria-checked", "true");
   });

   test("allows user to type a review", async () => {
      const user = userEvent.setup();
      render(<WriteReview />);

      const textarea = screen.getByPlaceholderText(
         /talk about your experience/i,
      );

      await user.type(textarea, "Great service");

      expect(textarea).toHaveValue("Great service");
   });

   test("allows user to change the category", async () => {
      const user = userEvent.setup();
      render(<WriteReview />);

      const select = screen.getByRole("combobox");
      await user.selectOptions(select, "Quality");

      expect(select).toHaveValue("Quality");
   });

   test("opens photo modal when photo button is clicked", async () => {
      const user = userEvent.setup();
      const { container } = render(<WriteReview />);

      const photoButton =
         container.querySelector(".wr-photoCard");
      await user.click(photoButton);

      expect(
         screen.getByTestId("modal"),
      ).toBeInTheDocument();
   });
});
