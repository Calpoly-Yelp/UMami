import {
   render,
   screen,
   fireEvent,
   waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import PhotoUpload from "../components/PhotoUpload";

// Mock the upload helper used by PhotoUpload.
// This prevents real Supabase/network calls during tests.
jest.mock("../lib/uploadPhoto", () => ({
   uploadReviewPhoto: jest.fn(),
}));

// Import the mocked function so we can control its behavior in each test.
import { uploadReviewPhoto } from "../lib/uploadPhoto";

describe("PhotoUpload component", () => {
   beforeEach(() => {
      // Mock the browser preview URL that appears after file selection.
      URL.createObjectURL = jest.fn(
         () => "mock-preview-url",
      );

      // Clear mock call history before each test.
      jest.clearAllMocks();
   });

   test("renders the photo upload UI", () => {
      render(
         <PhotoUpload
            onPhotoSelected={jest.fn()}
            onClose={jest.fn()}
         />,
      );

      // Main title should appear
      expect(
         screen.getByText(/shake smart photo upload/i),
      ).toBeInTheDocument();

      // Upload instructions should appear
      expect(
         screen.getByText(
            /drag and drop \/ select photo here/i,
         ),
      ).toBeInTheDocument();

      // Upload card behaves like a button
      expect(
         screen.getByRole("button", {
            name: /upload drag and drop \/ select photo here/i,
         }),
      ).toBeInTheDocument();
   });

   test("allows user to change photo type", async () => {
      const user = userEvent.setup();

      render(
         <PhotoUpload
            onPhotoSelected={jest.fn()}
            onClose={jest.fn()}
         />,
      );

      const selects = screen.getAllByRole("combobox");
      const photoTypeSelect = selects[0];

      await user.selectOptions(photoTypeSelect, "Other");

      expect(photoTypeSelect).toHaveValue("Other");
   });

   test("shows preview image after file selection", async () => {
      // Mock a successful upload
      uploadReviewPhoto.mockResolvedValue(
         "mock-uploaded-url",
      );

      const { container } = render(
         <PhotoUpload
            onPhotoSelected={jest.fn()}
            onClose={jest.fn()}
         />,
      );

      const fileInput =
         container.querySelector(".file-input");

      const file = new File(
         ["dummy content"],
         "photo.png",
         {
            type: "image/png",
         },
      );

      // Simulate file selection
      fireEvent.change(fileInput, {
         target: { files: [file] },
      });

      // The component should generate a local preview URL
      expect(URL.createObjectURL).toHaveBeenCalledWith(
         file,
      );

      // Preview image should appear immediately
      expect(
         screen.getByAltText(/preview/i),
      ).toBeInTheDocument();

      expect(
         screen.getByAltText(/preview/i),
      ).toHaveAttribute("src", "mock-preview-url");

      // Let the async upload settle so React state updates complete cleanly
      await waitFor(() => {
         expect(uploadReviewPhoto).toHaveBeenCalledWith(
            file,
         );
      });
   });

   test("calls onPhotoSelected and onClose when upload succeeds", async () => {
      const onPhotoSelected = jest.fn();
      const onClose = jest.fn();

      // Mock successful upload return value
      uploadReviewPhoto.mockResolvedValue(
         "mock-uploaded-url",
      );

      const { container } = render(
         <PhotoUpload
            onPhotoSelected={onPhotoSelected}
            onClose={onClose}
         />,
      );

      const fileInput =
         container.querySelector(".file-input");

      const file = new File(
         ["dummy content"],
         "photo.png",
         {
            type: "image/png",
         },
      );

      fireEvent.change(fileInput, {
         target: { files: [file] },
      });

      // Wait for async upload flow to complete
      await waitFor(() => {
         expect(onPhotoSelected).toHaveBeenCalledWith(
            "mock-uploaded-url",
         );
      });

      expect(onClose).toHaveBeenCalledTimes(1);
   });

   test("shows an error when upload fails", async () => {
      // Mock a failed upload
      uploadReviewPhoto.mockRejectedValue(
         new Error("network broke"),
      );

      const { container } = render(
         <PhotoUpload
            onPhotoSelected={jest.fn()}
            onClose={jest.fn()}
         />,
      );

      const fileInput =
         container.querySelector(".file-input");

      const file = new File(
         ["dummy content"],
         "photo.png",
         {
            type: "image/png",
         },
      );

      fireEvent.change(fileInput, {
         target: { files: [file] },
      });

      // Wait for the component to show the error
      await waitFor(() => {
         expect(
            screen.getByText(
               /upload failed: network broke/i,
            ),
         ).toBeInTheDocument();
      });
   });

   test("shows uploading state while upload is in progress", async () => {
      let resolveUpload;

      // Create a promise we can manually resolve later
      uploadReviewPhoto.mockImplementation(
         () =>
            new Promise((resolve) => {
               resolveUpload = resolve;
            }),
      );

      const onPhotoSelected = jest.fn();
      const onClose = jest.fn();

      const { container } = render(
         <PhotoUpload
            onPhotoSelected={onPhotoSelected}
            onClose={onClose}
         />,
      );

      const fileInput =
         container.querySelector(".file-input");

      const file = new File(
         ["dummy content"],
         "photo.png",
         {
            type: "image/png",
         },
      );

      fireEvent.change(fileInput, {
         target: { files: [file] },
      });

      // While the upload is pending, "Uploading..." should appear
      expect(
         screen.getByText(/uploading/i),
      ).toBeInTheDocument();

      // Finish the upload so the test does not hang
      resolveUpload("mock-uploaded-url");

      // Wait for post-upload callbacks/state updates to settle
      await waitFor(() => {
         expect(onPhotoSelected).toHaveBeenCalledWith(
            "mock-uploaded-url",
         );
      });

      expect(onClose).toHaveBeenCalledTimes(1);
   });
});
