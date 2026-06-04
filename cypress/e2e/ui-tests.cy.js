describe("Frontend UI Tests", () => {
   const FRONTEND_URL = "http://localhost:5173";
   const API_URL = "http://localhost:4000/api";

   // Reusable helper to dismiss the photo prompt modal if it appears.
   // The modal is shown to users who have not yet set a profile photo,
   // and can block interactions with the rest of the page.
   const dismissPhotoModal = () => {
      cy.get("body").then(($body) => {
         if ($body.find(".modal-overlay").length > 0) {
            cy.contains("button", /skip for now/i).click();
         }
      });
   };

   // This test performs a full end-to-end user journey through the UI.
   // It tests logging in, searching for a specific restaurant ("Taco Bell"),
   // opening the restaurant's page, writing and submitting a 5-star review with a photo and tags,
   // verifying the review appears on the page, deleting the review to clean up, and finally signing out.
   it("should simulate a complete user review flow", () => {
      cy.intercept("GET", `${API_URL}/restaurants*`).as(
         "getRestaurants",
      );
      const reviewMessage = `The tacos were amazing and the service was incredibly fast! - ${Date.now()}`;

      const testEmail = Cypress.env("TEST_EMAIL");
      const testPassword = Cypress.env("TEST_PASSWORD");
      expect(testEmail, "Test Email must be defined").to.not
         .be.undefined;
      expect(testPassword, "Test Password must be defined")
         .to.not.be.undefined;

      cy.visit(`${FRONTEND_URL}/signin`);
      cy.get('.auth__input[type="email"]').type(testEmail);
      cy.get('.auth__input[type="password"]').type(
         testPassword,
      );
      cy.get('button[type="submit"].auth__primary').click();

      cy.wait("@getRestaurants");
      cy.get(".profile-icon").should("be.visible");

      // Dismiss the photo prompt modal if it appears before interacting with the page
      dismissPhotoModal();

      cy.get(
         '.search-input[placeholder*="Search restaurants" i]',
      ).type("Taco Bell");

      cy.intercept("GET", `${API_URL}/restaurants/*`).as(
         "getRestaurantInfo",
      );
      cy.intercept("GET", `${API_URL}/reviews*`).as(
         "getReviews",
      );
      cy.contains("Taco Bell").click();

      cy.wait("@getRestaurantInfo");
      cy.wait("@getReviews");

      cy.contains("write review").click({ force: true });

      cy.get(
         'button.wr-star[aria-label="5 stars"]',
      ).click();

      cy.get("textarea.wr-textarea").type(reviewMessage);

      cy.get(".wr-tag-input").type("Fast");
      cy.contains(".wr-tag-option", "Fast").click();

      cy.get(".wr-photoBox").click();

      cy.get('input[type="file"]').selectFile(
         "cypress/fixtures/dummy.jpg",
         { force: true },
      );

      cy.contains("button.submit-btn", "Add Photo").click();

      cy.intercept("POST", `${API_URL}/reviews`).as(
         "createReview",
      );
      cy.contains("button", /^submit$/i).click();
      cy.wait("@createReview")
         .its("response.statusCode")
         .should("eq", 201);

      cy.contains(reviewMessage).should("exist");

      cy.intercept("DELETE", `${API_URL}/reviews/*`).as(
         "deleteReview",
      );

      cy.contains(reviewMessage)
         .parents(".review-card")
         .find(".review-delete-btn")
         .click({ force: true })
         .click({ force: true });
      cy.wait("@deleteReview")
         .its("response.statusCode")
         .should("eq", 200);

      cy.get(".profile-icon").click();
      cy.contains(".dropdown-item", "Sign Out").click();
      cy.url().should("include", "/signin");
   });

   it("should simulate user following, bookmarking, and profile navigation", () => {
      cy.intercept("GET", `${API_URL}/restaurants*`).as(
         "getRestaurants",
      );

      const testEmail = Cypress.env("TEST_EMAIL");
      const testPassword = Cypress.env("TEST_PASSWORD");
      expect(testEmail, "Test Email must be defined").to.not
         .be.undefined;
      expect(testPassword, "Test Password must be defined")
         .to.not.be.undefined;

      // 1. Log in
      cy.visit(`${FRONTEND_URL}/signin`);
      cy.get('.auth__input[type="email"]').type(testEmail);
      cy.get('.auth__input[type="password"]').type(
         testPassword,
      );
      cy.get('button[type="submit"].auth__primary').click();

      cy.wait("@getRestaurants");
      cy.get(".profile-icon").should("be.visible");

      // Dismiss the photo prompt modal if it appears before interacting with the page
      dismissPhotoModal();

      // 2. Follow 'musty mustang' in the search bar
      cy.intercept("GET", `${API_URL}/users?search=*`).as(
         "searchUsers",
      );
      cy.get(".search-icon").first().click();
      cy.get(".search-modal-input").type("musty mustang");
      cy.wait("@searchUsers");

      cy.contains(".search-result-name", /musty mustang/i)
         .parents(".search-result-item")
         .find("button.follow-btn")
         .then(($btn) => {
            if ($btn.attr("title") === "Follow User") {
               cy.wrap($btn).click({ force: true });
            }
         });

      cy.get(".search-modal-close").click();

      // 3. Bookmark a noodles restaurant
      cy.contains(".restaurant-name", /noodle/i)
         .parents(".restaurant-card")
         .find(".bookmark-button")
         .then(($btn) => {
            if (!$btn.hasClass("bookmarked")) {
               cy.wrap($btn).click({ force: true });
            }
         });

      // 4. Enter the user page via the header
      cy.get(".profile-icon").click();
      cy.contains(".dropdown-item", "My Account").click();
      cy.url().should("include", "/user");

      // 5. Click the restaurant the user bookmarked
      cy.get("#restaurants-list")
         .contains(".restaurant-name", /noodle/i)
         .click({ force: true });
      cy.url().should("include", "/restaurants/");

      // 6. Go back to user page
      cy.get(".profile-icon").click();
      cy.contains(".dropdown-item", "My Account").click();
      cy.url().should("include", "/user");

      // 7. Unbookmark the restaurant
      cy.get("#restaurants-list")
         .contains(".restaurant-name", /noodle/i)
         .parents(".restaurant-card")
         .find(".bookmark-button")
         .click({ force: true });

      // 8. Enter 'musty mustang' user page via the users followed list
      cy.get("#following-list")
         .contains(/musty mustang/i)
         .click({ force: true });
      cy.url().should("include", "/user/");

      // 9. Go back to the user page
      cy.get(".profile-icon").click();
      cy.contains(".dropdown-item", "My Account").click();
      cy.url().should("include", "/user");

      // 10. Unfollow musty
      cy.get("#following-list")
         .contains(/musty mustang/i)
         .parents(".followed-user-card")
         .find(".follow-button")
         .click({ force: true });

      // 11. Sign out via the header
      cy.get(".profile-icon").click();
      cy.contains(".dropdown-item", "Sign Out").click();
      cy.url().should("include", "/signin");
   });
});
