import "../test-setup.js";

import {
   describe,
   test,
   expect,
   jest,
   beforeAll,
} from "@jest/globals";
import {
   render,
   screen,
   fireEvent,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import Header from "../components/header.jsx";

describe("Global Header Component", () => {
   const mockNotifications = [
      {
         id: 1,
         message: "New Friend Request",
         is_read: false,
         type: "friend_request",
      },
      {
         id: 2,
         message: "Menu Update",
         is_read: false,
         type: "menu_update",
      },
      {
         id: 3,
         message: "Review Like",
         is_read: true,
         type: "review_like",
      },
      {
         id: 4,
         message: "System Message",
         is_read: true,
         type: "system",
      },
      {
         id: 5,
         message: "Hidden Message",
         is_read: true,
         type: "system",
      }, // For load more test
   ];

   beforeAll(() => {
      global.fetch = jest.fn((url) => {
         if (url.includes("/notifications")) {
            return Promise.resolve({
               ok: true,
               json: () =>
                  Promise.resolve(mockNotifications),
            });
         }
         return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({}),
         });
      });
   });

   // Verify the component renders the main container
   test("renders the header container", async () => {
      render(
         <BrowserRouter>
            <Header />
         </BrowserRouter>,
      );
      const headerElement =
         document.querySelector(".app-header");
      expect(headerElement).toBeInTheDocument();
      // Wait for notifications to load to prevent act() warning
      await screen.findByText("2");
   });

   // Verify the Logo is present and contains the correct text
   test("renders the application logo", async () => {
      render(
         <BrowserRouter>
            <Header />
         </BrowserRouter>,
      );
      // The Logo is now an image
      const logoImage = screen.getByRole("img", {
         name: /umami logo/i,
      });
      expect(logoImage).toBeInTheDocument();
      await screen.findByText("2");
   });

   // Verify the Account Icon is present
   test("renders the account profile icon", async () => {
      render(
         <BrowserRouter>
            <Header />
         </BrowserRouter>,
      );
      // The icon is rendered as an SVG by react-icons
      const iconSvg = document.querySelector(
         ".app-header svg",
      );
      expect(iconSvg).toBeInTheDocument();
      await screen.findByText("2");
   });

   // Verify dropdown toggles
   test("toggles dropdown menu on account icon click", async () => {
      render(
         <BrowserRouter>
            <Header />
         </BrowserRouter>,
      );
      const iconSvg =
         document.querySelector(".profile-icon");

      // Dropdown should not be visible initially
      expect(
         screen.queryByText("My Account"),
      ).not.toBeInTheDocument();

      // Click icon to open
      fireEvent.click(iconSvg);
      expect(
         screen.getByText("My Account"),
      ).toBeInTheDocument();
      expect(
         screen.getByText("Sign Out"),
      ).toBeInTheDocument();
      await screen.findByText("2");
   });

   // --- Notification Tests ---
   describe("Notification Functionality", () => {
      test("renders notification bell with badge count", async () => {
         render(
            <BrowserRouter>
               <Header />
            </BrowserRouter>,
         );

         // Wait for fetch to complete and badge to appear (2 unread)
         const badge = await screen.findByText("2");
         expect(badge).toBeInTheDocument();
         expect(badge).toHaveClass("notification-badge");
      });

      test("opens notification dropdown and displays items", async () => {
         render(
            <BrowserRouter>
               <Header />
            </BrowserRouter>,
         );

         // Open dropdown
         const bellIcon = document.querySelector(
            ".notification-icon",
         );
         fireEvent.click(bellIcon);

         // Check for items (only 4 visible by default)
         expect(
            await screen.findByText("New Friend Request"),
         ).toBeInTheDocument();
         expect(
            screen.getByText("Menu Update"),
         ).toBeInTheDocument();
         // The 5th message should be hidden initially
         expect(
            screen.queryByText("Hidden Message"),
         ).not.toBeInTheDocument();
      });

      test("load more button reveals hidden notifications", async () => {
         render(
            <BrowserRouter>
               <Header />
            </BrowserRouter>,
         );

         const bellIcon = document.querySelector(
            ".notification-icon",
         );
         fireEvent.click(bellIcon);

         // Find load more button
         const loadMoreBtn = await screen.findByText(
            /\+1 more notifications/,
         );
         fireEvent.click(loadMoreBtn);

         // Check if hidden message is now visible
         expect(
            screen.getByText("Hidden Message"),
         ).toBeInTheDocument();
      });

      test("clicking 'Clear all' removes notifications", async () => {
         render(
            <BrowserRouter>
               <Header />
            </BrowserRouter>,
         );

         const bellIcon = document.querySelector(
            ".notification-icon",
         );
         fireEvent.click(bellIcon);

         const clearAllBtn =
            await screen.findByText("Clear all");
         fireEvent.click(clearAllBtn);

         // Verify UI update
         expect(
            await screen.findByText("No new notifications"),
         ).toBeInTheDocument();

         // Verify fetch call
         expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/delete-all"),
            expect.objectContaining({ method: "DELETE" }),
         );
      });
   });
});
