import {
   render,
   screen,
   fireEvent,
   waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import WriteReview from "../components/WriteReview.jsx";

// Mock upload helper to prevent real network requests during tests
jest.mock("../lib/uploadPhoto", () => ({
   uploadReviewPhoto: jest.fn(() =>
      Promise.resolve("mock-uploaded-url"),
   ),
}));

// Mock PhotoUpload so we do not test upload internals here
jest.mock("../components/PhotoUpload.jsx", () => {
   return function MockPhotoUpload() {
      return <div>Mock Photo Upload</div>;
   };
});

describe("WriteReview component", () => {
   beforeEach(() => {
      jest.clearAllMocks();

      global.fetch = jest.fn(() =>
         Promise.resolve({
            ok: true,
            json: () =>
               Promise.resolve({ id: 123, rating: 4 }),
         }),
      );
   });

   test("renders the basic UI elements", async () => {
      render(
         <WriteReview
            restaurantId={1}
            userId="test-user"
         />,
      );

      expect(
         await screen.findByText(/rate your experience/i),
      ).toBeInTheDocument();
      expect(
         screen.getByPlaceholderText(
            /talk about your experience/i,
         ),
      ).toBeInTheDocument();
   });

   test("allows user to select a star rating", async () => {
      render(
         <WriteReview
            restaurantId={1}
            userId="test-user"
         />,
      );

      const starButtons =
         await screen.findAllByRole("radio");

      fireEvent.click(starButtons[3]);

      expect(starButtons[3]).toHaveAttribute(
         "aria-checked",
         "true",
      );
   });

   test("allows user to type a review", async () => {
      render(
         <WriteReview
            restaurantId={1}
            userId="test-user"
         />,
      );

      const textarea = await screen.findByPlaceholderText(
         /talk about your experience/i,
      );

      fireEvent.change(textarea, {
         target: { value: "Great food and service!" },
      });

      expect(textarea).toHaveValue(
         "Great food and service!",
      );
   });

   test("allows user to add tags", async () => {
      render(
         <WriteReview
            restaurantId={1}
            userId="test-user"
         />,
      );

      const input = screen.getByPlaceholderText(
         /search and add tags/i,
      );

      fireEvent.focus(input);
      fireEvent.change(input, {
         target: { value: "Vegan" },
      });

      const option = await screen.findByText("Vegan");
      fireEvent.mouseDown(option);

      expect(screen.getByText("Vegan")).toBeInTheDocument();
   });

   test("renders the photo upload overlay", async () => {
      render(
         <WriteReview
            restaurantId={1}
            userId="test-user"
         />,
      );

      const btn = screen.getByRole("button", {
         name: /\+ upload photo/i,
      });
      fireEvent.click(btn);

      expect(
         await screen.findByText(/mock photo upload/i),
      ).toBeInTheDocument();
   });

   test("submits review and calls callbacks after clicking submit", async () => {
      const onSuccessMock = jest.fn();
      const onCloseMock = jest.fn();

      render(
         <WriteReview
            restaurantId={1}
            userId="test-user"
            onSuccess={onSuccessMock}
            onClose={onCloseMock}
         />,
      );

      const starButtons =
         await screen.findAllByRole("radio");
      fireEvent.click(starButtons[3]);

      const textarea = await screen.findByPlaceholderText(
         /talk about your experience/i,
      );

      fireEvent.change(textarea, {
         target: { value: "Amazing place!" },
      });

      const submitButton = screen.getByRole("button", {
         name: /^submit$/i,
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
         expect(global.fetch).toHaveBeenCalled();
      });

      await waitFor(() => {
         expect(onSuccessMock).toHaveBeenCalled();
      });

      expect(onCloseMock).toHaveBeenCalled();
   });
});
