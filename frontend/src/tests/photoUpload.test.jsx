import {
   render,
   screen,
   fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import PhotoUpload from "../components/PhotoUpload";

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
   });

   test("calls onPhotoSelected and onClose with file data", async () => {
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

      expect(
         screen.getByRole("button", {
            name: /^submit$/i,
         }),
      ).not.toBeDisabled();
      // Click the submit button
      fireEvent.click(
         screen.getByRole("button", {
            name: /^submit$/i,
         }),
      );

      expect(onPhotoSelected).toHaveBeenCalledWith({
         file: file,
         url: "mock-preview-url",
         type: "Menu Item",
         item: "Menu Item",
      });

      expect(onClose).toHaveBeenCalledTimes(1);
   });
});
