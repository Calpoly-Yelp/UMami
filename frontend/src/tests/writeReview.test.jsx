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
   return function MockPhotoUpload({
      onPhotoSelected,
      onClose,
   }) {
      return (
         <div>
            <div>Mock Photo Upload</div>
            <button
               type="button"
               onClick={() =>
                  onPhotoSelected({
                     file: new File(
                        ["dummy"],
                        "photo.png",
                        {
                           type: "image/png",
                        },
                     ),
                     url: "mock-local-photo-url",
                     type: "Other",
                     item: "",
                  })
               }
            >
               Add Mock Photo
            </button>
            <button type="button" onClick={onClose}>
               Close Mock Upload
            </button>
         </div>
      );
   };
});

describe("WriteReview component", () => {
   beforeEach(() => {
      jest.clearAllMocks();

      global.fetch = jest.fn((url) => {
         if (url && url.includes("/menu")) {
            return new Promise(() => {}); // Hangs the promise to prevent the state update act() warning
         }
         return Promise.resolve({
            ok: true,
            json: () =>
               Promise.resolve({ id: 123, rating: 4 }),
         });
      });
   });

   test("renders the basic UI elements", () => {
      render(
         <WriteReview
            restaurantId={1}
            userId="test-user"
         />,
      );

      expect(
         screen.getByText(/rate your experience/i),
      ).toBeInTheDocument();

      expect(
         screen.getByPlaceholderText(
            /talk about your experience/i,
         ),
      ).toBeInTheDocument();

      expect(
         screen.getByText(/tags \(0\/15\):/i),
      ).toBeInTheDocument();

      expect(
         screen.getByText(
            /show your experience \(0\/10\):/i,
         ),
      ).toBeInTheDocument();
   });

   test("allows user to select a star rating", () => {
      render(
         <WriteReview
            restaurantId={1}
            userId="test-user"
         />,
      );

      const starButtons = screen.getAllByRole("radio");

      fireEvent.click(starButtons[3]);

      expect(starButtons[3]).toHaveAttribute(
         "aria-checked",
         "true",
      );
   });

   test("allows user to type a review", () => {
      render(
         <WriteReview
            restaurantId={1}
            userId="test-user"
         />,
      );

      const textarea = screen.getByPlaceholderText(
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

   test("opens the photo upload overlay when the empty photo box is clicked", async () => {
      render(
         <WriteReview
            restaurantId={1}
            userId="test-user"
         />,
      );

      const emptyPhotoBox = screen.getByRole("button", {
         name: /upload got pictures\? we'd love to see them!/i,
      });

      fireEvent.click(emptyPhotoBox);

      expect(
         await screen.findByText(/mock photo upload/i),
      ).toBeInTheDocument();
   });

   test("shows '+ Upload Another Photo' only after a photo has been added", async () => {
      render(
         <WriteReview
            restaurantId={1}
            userId="test-user"
         />,
      );

      expect(
         screen.queryByRole("button", {
            name: /\+ upload another photo/i,
         }),
      ).not.toBeInTheDocument();

      const emptyPhotoBox = screen.getByRole("button", {
         name: /upload got pictures\? we'd love to see them!/i,
      });

      fireEvent.click(emptyPhotoBox);

      fireEvent.click(
         await screen.findByRole("button", {
            name: /add mock photo/i,
         }),
      );

      expect(
         screen.getByRole("button", {
            name: /\+ upload another photo/i,
         }),
      ).toBeInTheDocument();
   });

   test("submit button is disabled until a rating is selected", () => {
      render(
         <WriteReview
            restaurantId={1}
            userId="test-user"
         />,
      );

      const submitButton = screen.getByRole("button", {
         name: /^submit$/i,
      });

      expect(submitButton).toBeDisabled();

      const starButtons = screen.getAllByRole("radio");
      fireEvent.click(starButtons[3]);

      expect(submitButton).not.toBeDisabled();
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

      const starButtons = screen.getAllByRole("radio");
      fireEvent.click(starButtons[3]);

      const textarea = screen.getByPlaceholderText(
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
         expect(global.fetch).toHaveBeenCalledWith(
            "http://localhost:4000/api/reviews",
            expect.objectContaining({
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
               },
            }),
         );
      });

      await waitFor(() => {
         expect(onSuccessMock).toHaveBeenCalled();
      });

      expect(onCloseMock).toHaveBeenCalled();
   });
});
