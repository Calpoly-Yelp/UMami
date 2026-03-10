import {
   render,
   screen,
   fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Modal from "../components/modal";

describe("Modal component", () => {
   test("renders nothing when open is false", () => {
      render(
         <Modal
            open={false}
            onClose={jest.fn()}
            title="My Modal"
         >
            <p>Modal content</p>
         </Modal>,
      );

      expect(
         screen.queryByText("My Modal"),
      ).not.toBeInTheDocument();
      expect(
         screen.queryByText("Modal content"),
      ).not.toBeInTheDocument();
   });

   test("renders title and children when open is true", () => {
      render(
         <Modal
            open={true}
            onClose={jest.fn()}
            title="My Modal"
         >
            <p>Modal content</p>
         </Modal>,
      );

      expect(
         screen.getByText("My Modal"),
      ).toBeInTheDocument();
      expect(
         screen.getByText("Modal content"),
      ).toBeInTheDocument();
      expect(
         screen.getByRole("button", { name: /close/i }),
      ).toBeInTheDocument();
   });

   test("calls onClose when close button is clicked", async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      render(
         <Modal
            open={true}
            onClose={onClose}
            title="My Modal"
         >
            <p>Modal content</p>
         </Modal>,
      );

      await user.click(
         screen.getByRole("button", { name: /close/i }),
      );

      expect(onClose).toHaveBeenCalledTimes(1);
   });

   test("calls onClose when Escape key is pressed", () => {
      const onClose = jest.fn();

      render(
         <Modal
            open={true}
            onClose={onClose}
            title="My Modal"
         >
            <p>Modal content</p>
         </Modal>,
      );

      fireEvent.keyDown(window, {
         key: "Escape",
         code: "Escape",
      });

      expect(onClose).toHaveBeenCalledTimes(1);
   });

   test("calls onClose when overlay is clicked", async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      const { container } = render(
         <Modal
            open={true}
            onClose={onClose}
            title="My Modal"
         >
            <p>Modal content</p>
         </Modal>,
      );

      const overlay = container.querySelector(
         ".modal-overlay",
      );
      await user.click(overlay);

      expect(onClose).toHaveBeenCalledTimes(1);
   });

   test("does not call onClose when modal panel is clicked", async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      const { container } = render(
         <Modal
            open={true}
            onClose={onClose}
            title="My Modal"
         >
            <p>Modal content</p>
         </Modal>,
      );

      const panel = container.querySelector(".modal-panel");
      await user.click(panel);

      expect(onClose).not.toHaveBeenCalled();
   });
});
