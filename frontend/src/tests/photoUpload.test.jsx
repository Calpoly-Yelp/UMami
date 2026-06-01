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
      jest.clearAllMocks();
   });

   test("renders the photo upload UI", () => {
      render(
         <PhotoUpload
            onPhotoSelected={jest.fn()}
            onClose={jest.fn()}
         />,
      );

      expect(
         screen.getByText(/shake smart photo upload/i),
      ).toBeInTheDocument();

      expect(
         screen.getByText(
            /drag and drop \/ select photo here/i,
         ),
      ).toBeInTheDocument();

      expect(
         screen.getByText(/what is this a photo of\?/i),
      ).toBeInTheDocument();

      expect(
         screen.queryByText(/what menu item is this\?/i),
      ).not.toBeInTheDocument();
   });

   test("defaults photo type to Other", () => {
      render(
         <PhotoUpload
            onPhotoSelected={jest.fn()}
            onClose={jest.fn()}
         />,
      );

      const photoTypeSelect = screen.getByRole("combobox");

      expect(photoTypeSelect).toHaveValue("Other");
   });

   test("shows menu item dropdown when Menu Item is selected", async () => {
      const user = userEvent.setup();

      render(
         <PhotoUpload
            onPhotoSelected={jest.fn()}
            onClose={jest.fn()}
         />,
      );

      const photoTypeSelect = screen.getByRole("combobox");

      await user.selectOptions(
         photoTypeSelect,
         "Menu Item",
      );

      expect(photoTypeSelect).toHaveValue("Menu Item");

      expect(
         screen.getByText(/what menu item is this\?/i),
      ).toBeInTheDocument();

      expect(
         screen.getByPlaceholderText(/search menu items/i),
      ).toBeInTheDocument();
   });

   test("hides menu item dropdown when switched away from Menu Item", async () => {
      const user = userEvent.setup();

      render(
         <PhotoUpload
            onPhotoSelected={jest.fn()}
            onClose={jest.fn()}
         />,
      );

      const photoTypeSelect = screen.getByRole("combobox");

      await user.selectOptions(
         photoTypeSelect,
         "Menu Item",
      );
      expect(
         screen.getByText(/what menu item is this\?/i),
      ).toBeInTheDocument();

      await user.selectOptions(photoTypeSelect, "Ambiance");

      expect(photoTypeSelect).toHaveValue("Ambiance");
      expect(
         screen.queryByText(/what menu item is this\?/i),
      ).not.toBeInTheDocument();
   });

   test("shows preview image after file selection", () => {
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
         { type: "image/png" },
      );

      fireEvent.change(fileInput, {
         target: { files: [file] },
      });

      expect(URL.createObjectURL).toHaveBeenCalledWith(
         file,
      );

      const previewImage = screen.getByAltText(/preview/i);
      expect(previewImage).toBeInTheDocument();
      expect(previewImage).toHaveAttribute(
         "src",
         "mock-preview-url",
      );
   });

   test("calls onPhotoSelected and onClose with file data when Add Photo is clicked", () => {
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
         { type: "image/png" },
      );

      fireEvent.change(fileInput, {
         target: { files: [file] },
      });

      const addPhotoButton = screen.getByRole("button", {
         name: /add photo/i,
      });

      expect(addPhotoButton).not.toBeDisabled();

      fireEvent.click(addPhotoButton);

      expect(onPhotoSelected).toHaveBeenCalledWith({
         file,
         url: "mock-preview-url",
         type: "Other",
         item: "",
      });

      expect(onClose).toHaveBeenCalledTimes(1);
   });

   test("submits selected menu item when photo type is Menu Item", async () => {
      const user = userEvent.setup();
      const onPhotoSelected = jest.fn();
      const onClose = jest.fn();

      const { container } = render(
         <PhotoUpload
            onPhotoSelected={onPhotoSelected}
            onClose={onClose}
         />,
      );

      const photoTypeSelect = screen.getByRole("combobox");

      await user.selectOptions(
         photoTypeSelect,
         "Menu Item",
      );

      const searchInput = screen.getByPlaceholderText(
         /search menu items/i,
      );
      await user.type(searchInput, "Menu Item");

      const fileInput =
         container.querySelector(".file-input");

      const file = new File(
         ["dummy content"],
         "photo.png",
         { type: "image/png" },
      );

      fireEvent.change(fileInput, {
         target: { files: [file] },
      });

      fireEvent.click(
         screen.getByRole("button", {
            name: /add photo/i,
         }),
      );

      expect(onPhotoSelected).toHaveBeenCalledWith({
         file,
         url: "mock-preview-url",
         type: "Menu Item",
         item: "Menu Item",
      });

      expect(onClose).toHaveBeenCalledTimes(1);
   });
});
