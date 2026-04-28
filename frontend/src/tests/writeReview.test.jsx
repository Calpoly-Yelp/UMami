import {
   render,
   screen,
   fireEvent,
   waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import WriteReview from "../components/WriteReview.jsx";

// Mock react-router-dom hooks used by WriteReview
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
   useNavigate: () => mockNavigate,
   useSearchParams: () => [
      {
         get: jest.fn((key) => {
            if (key === "restaurant_id") {
               return "123";
            }
            return null;
         }),
      },
   ],
}));

// Mock Supabase session lookup
jest.mock("../lib/supabase", () => ({
   supabase: {
      auth: {
         getSession: jest.fn(() =>
            Promise.resolve({
               data: {
                  session: {
                     user: { id: "test-user-id" },
                  },
               },
            }),
         ),
      },
   },
}));

// Mock Modal so we can assert it renders
jest.mock("../components/Modal.jsx", () => {
   return function MockModal({ children }) {
      return <div data-testid="mock-modal">{children}</div>;
   };
});

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
            json: () => Promise.resolve({}),
         }),
      );
   });

   test("renders the title", async () => {
      render(<WriteReview />);

      expect(
         await screen.findByText(/shake smart review/i),
      ).toBeInTheDocument();
   });

   test("allows user to select a star rating", async () => {
      render(<WriteReview />);

      // In the current UI, stars are radios
      const starButtons =
         await screen.findAllByRole("radio");

      fireEvent.click(starButtons[3]);

      // 4th star should now be selected
      expect(starButtons[3]).toHaveAttribute(
         "aria-checked",
         "true",
      );
   });

   test("allows user to type a review", async () => {
      render(<WriteReview />);

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

   test("allows user to change the category", async () => {
      render(<WriteReview />);

      const select = await screen.findByRole("combobox");

      // Current options are Service / Quality / Other
      fireEvent.change(select, {
         target: { value: "Quality" },
      });

      expect(select).toHaveValue("Quality");
   });

   test("renders the photo upload modal content", async () => {
      render(<WriteReview />);

      expect(
         await screen.findByTestId("mock-modal"),
      ).toBeInTheDocument();

      expect(
         screen.getByText(/mock photo upload/i),
      ).toBeInTheDocument();
   });

   test("submits review and navigates after clicking submit", async () => {
      render(<WriteReview />);

      const textarea = await screen.findByPlaceholderText(
         /talk about your experience/i,
      );

      fireEvent.change(textarea, {
         target: { value: "Amazing place!" },
      });

      const submitButton = screen.getByRole("button", {
         name: /submit review/i,
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
         expect(global.fetch).toHaveBeenCalled();
      });

      await waitFor(() => {
         expect(mockNavigate).toHaveBeenCalled();
      });
   });
});
