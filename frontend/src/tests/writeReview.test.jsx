import {
   render,
   screen,
   waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import WriteReview from "../components/WriteReview";

jest.mock("../components/PhotoUpload", () => {
   return function MockPhotoUpload() {
      return <div>PhotoUpload</div>;
   };
});

describe("WriteReview component", () => {
   beforeAll(() => {
      global.fetch = jest.fn(() =>
         Promise.resolve({
            ok: true,
            json: () => Promise.resolve({}),
         }),
      );
   });

   afterEach(() => {
      jest.clearAllMocks();
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

   test("opens photo modal when photo button is clicked", async () => {
      const user = userEvent.setup();
      render(<WriteReview />);

      const photoButton = screen.getByText(/Upload Photo/i);
      await user.click(photoButton);

      expect(
         screen.getByText("PhotoUpload"),
      ).toBeInTheDocument();
   });

   test("calls onClose when cancel button is clicked", async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();
      render(<WriteReview onClose={mockOnClose} />);

      const cancelButton = screen.getByRole("button", {
         name: /cancel/i,
      });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
   });

   test("submit button is disabled until a rating is selected", () => {
      render(<WriteReview />);

      const submitButton = screen.getByRole("button", {
         name: /submit review/i,
      });
      expect(submitButton).toBeDisabled();
   });

   test("calls onClose when submit button is clicked", async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();
      render(
         <WriteReview
            onClose={mockOnClose}
            restaurantId={1}
            userId="user123"
         />,
      );

      // Must select a rating to enable the submit button
      const star3 = screen.getByRole("radio", {
         name: /3 stars/i,
      });
      await user.click(star3);

      const submitButton = screen.getByRole("button", {
         name: /submit review/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
         expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
   });
});
