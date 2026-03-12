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
      URL.createObjectURL = jest.fn(
         () => "mock-preview-url",
      );
   });

   test("renders the photo upload UI", () => {
      render(<PhotoUpload />);

      expect(
         screen.getByText(/shake smart photo upload/i),
      ).toBeInTheDocument();

      expect(
         screen.getByText(
            /drag and drop \/ select photo here/i,
         ),
      ).toBeInTheDocument();

      expect(
         screen.getByRole("button", {
            name: /submit photo/i,
         }),
      ).toBeInTheDocument();
   });

   test("submit button is disabled before a photo is uploaded", () => {
      render(<PhotoUpload />);

      expect(
         screen.getByRole("button", {
            name: /submit photo/i,
         }),
      ).toBeDisabled();
   });

   test("allows user to change photo type", async () => {
      const user = userEvent.setup();
      render(<PhotoUpload />);

      const selects = screen.getAllByRole("combobox");
      const photoTypeSelect = selects[0];

      await user.selectOptions(photoTypeSelect, "Other");

      expect(photoTypeSelect).toHaveValue("Other");
   });

   test("calls onPhotoSelected and onClose when a file is uploaded", () => {
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

      expect(URL.createObjectURL).toHaveBeenCalledWith(
         file,
      );
      expect(onPhotoSelected).toHaveBeenCalledWith(
         "mock-preview-url",
      );
      expect(onClose).toHaveBeenCalledTimes(1);
   });

   test("shows preview image after file upload", () => {
      const { container } = render(<PhotoUpload />);

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
         screen.getByAltText(/preview/i),
      ).toBeInTheDocument();
      expect(
         screen.getByAltText(/preview/i),
      ).toHaveAttribute("src", "mock-preview-url");
   });

   test("submit button becomes enabled after file upload", () => {
      const { container } = render(<PhotoUpload />);

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
            name: /submit photo/i,
         }),
      ).not.toBeDisabled();
   });
});
