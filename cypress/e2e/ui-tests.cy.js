describe("Frontend UI Tests", () => {
   const FRONTEND_URL = "http://localhost:5173";
   const API_URL = "http://localhost:4000/api";

   // This test performs a full end-to-end user journey through the UI.
   // It tests logging in, searching for a specific restaurant ("Taco Bell"),
   // opening the restaurant's page, writing and submitting a 5-star review with a photo and tags,
   // verifying the review appears on the page, deleting the review to clean up, and finally signing out.
   it("should simulate a complete user review flow", () => {
      cy.intercept("GET", `${API_URL}/restaurants*`).as(
         "getRestaurants",
      );

      cy.visit(`${FRONTEND_URL}/signin`);
      cy.get('.auth__input[type="email"]').type(
         "schifflereli@gmail.com",
      );
      cy.get('.auth__input[type="password"]').type(
         "Testing1!",
      );
      cy.get('button[type="submit"].auth__primary').click();

      cy.wait("@getRestaurants");
      cy.get(".profile-icon").should("be.visible");

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

      cy.get("textarea.wr-textarea").type(
         "The tacos were amazing and the service was incredibly fast!",
      );

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

      cy.contains(
         "The tacos were amazing and the service was incredibly fast!",
      ).should("exist");

      cy.intercept("DELETE", `${API_URL}/reviews/*`).as(
         "deleteReview",
      );

      cy.contains(
         "The tacos were amazing and the service was incredibly fast!",
      )
         .parents(".review-card")
         .find(".review-delete-btn")
         .click({ force: true })
         .click({ force: true });
      cy.wait("@deleteReview")
         .its("response.statusCode")
         .should("eq", 200);

      cy.get(".profile-icon").click();
      cy.contains(".dropdown-item", "Sign Out").click();
   });
});
