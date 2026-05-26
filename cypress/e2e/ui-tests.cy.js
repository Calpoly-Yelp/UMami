describe("Frontend UI Tests", () => {
   const FRONTEND_URL = "http://localhost:5173";
   const API_URL = "http://localhost:4000/api";

   it("should simulate a complete user review flow", () => {
      // Intercept initial API calls to wait for them to finish
      cy.intercept("GET", `${API_URL}/restaurants*`).as(
         "getRestaurants",
      );

      // 1. Log in by visiting the signin page directly
      cy.visit(`${FRONTEND_URL}/signin`);
      cy.get('.auth__input[type="email"]').type(
         "schifflereli@gmail.com",
      );
      cy.get('.auth__input[type="password"]').type(
         "Testing1!",
      );
      cy.get('button[type="submit"].auth__primary').click();

      // Wait for redirect to home and header to load
      cy.wait("@getRestaurants");
      cy.get(".profile-icon").should("be.visible");

      // 2. Search for Taco Bell
      cy.get(
         '.search-input[placeholder*="Search restaurants" i]',
      ).type("Taco Bell");

      // 3. Click the Taco Bell restaurant card
      cy.intercept("GET", `${API_URL}/restaurants/*`).as(
         "getRestaurantInfo",
      );
      cy.intercept("GET", `${API_URL}/reviews*`).as(
         "getReviews",
      );
      cy.contains("Taco Bell").click();

      // Wait for the restaurant page and its reviews to load
      cy.wait("@getRestaurantInfo");
      cy.wait("@getReviews");

      // 4. Click the "write review" button (From your RestaurantInfo.jsx)
      cy.contains("write review").click({ force: true });

      // 5. Write a review with tags and a photo upload
      // Select a 5-star rating (using the specific aria-label from WriteReview)
      cy.get(
         'button.wr-star[aria-label="5 stars"]',
      ).click();

      // Type the review text
      cy.get("textarea.wr-textarea").type(
         "The tacos were amazing and the service was incredibly fast!",
      );

      // Add a tag
      cy.get(".wr-tag-input").type("Fast");
      cy.contains(".wr-tag-option", "Fast").click();

      // Upload a photo: First click the photo box to open the modal
      cy.get(".wr-photoBox").click();

      // Now select the file inside the newly opened modal
      cy.get('input[type="file"]').selectFile(
         "cypress/fixtures/dummy.jpg",
         { force: true },
      );

      // Click "Add Photo" to close the modal
      cy.contains("button.submit-btn", "Add Photo").click();

      // Submit the review
      cy.intercept("POST", `${API_URL}/reviews`).as(
         "createReview",
      );
      cy.contains("button", /^submit$/i).click();
      cy.wait("@createReview")
         .its("response.statusCode")
         .should("eq", 201);

      // Verify the review is posted
      cy.contains(
         "The tacos were amazing and the service was incredibly fast!",
      ).should("exist");

      // 6. Delete the review
      cy.intercept("DELETE", `${API_URL}/reviews/*`).as(
         "deleteReview",
      );

      // The ReviewCard delete button requires TWO clicks (prime -> confirm)
      cy.contains(
         "The tacos were amazing and the service was incredibly fast!",
      )
         .parents(".review-card")
         .find(".review-delete-btn")
         .click({ force: true }) // First click to prime (shows "Confirm?")
         .click({ force: true }); // Second click to delete
      cy.wait("@deleteReview")
         .its("response.statusCode")
         .should("eq", 200);

      // 7. Sign out (Hidden inside the profile dropdown in Header.jsx)
      cy.get(".profile-icon").click();
      cy.contains(".dropdown-item", "Sign Out").click();
   });
});
