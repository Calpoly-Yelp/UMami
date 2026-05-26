describe("Backend API Tests", () => {
   const API_URL = "http://localhost:4000/api";

   // This test verifies that the public GET endpoints are functioning correctly.
   // It first fetches a list of all restaurants, extracts the ID of the first one,
   // and makes a subsequent request to fetch all reviews associated with that specific restaurant.
   it("GET chain: should fetch restaurants and then fetch reviews for the first restaurant", () => {
      cy.request("GET", `${API_URL}/restaurants`).then(
         (response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.be.an("array");
            expect(response.body.length).to.be.greaterThan(
               0,
            );

            const firstRestaurantId = response.body[0].id;

            cy.request(
               "GET",
               `${API_URL}/reviews?restaurant_id=${firstRestaurantId}`,
            ).then((reviewsResponse) => {
               expect(reviewsResponse.status).to.eq(200);
               expect(reviewsResponse.body).to.be.an(
                  "array",
               );
            });
         },
      );
   });

   // This test verifies the authenticated POST and DELETE endpoints using programmatic login.
   // It hits the Supabase REST API to authenticate, stores the session token in a cookie,
   // uses that session to successfully create a new review, and then cleans up by deleting the review.
   it("POST chain: should authenticate, set a cookie, and create a new review", () => {
      const supabaseUrl = Cypress.env("VITE_SUPABASE_URL");
      const supabaseKey = Cypress.env(
         "VITE_SUPABASE_ANON_KEY",
      );

      expect(supabaseUrl, "Supabase URL must be defined").to
         .not.be.undefined;
      expect(
         supabaseKey,
         "Supabase Anon Key must be defined",
      ).to.not.be.undefined;

      cy.request({
         method: "POST",
         url: `${supabaseUrl}/auth/v1/token?grant_type=password`,
         headers: {
            apikey: supabaseKey,
         },
         body: {
            email: "schifflereli@gmail.com",
            password: "Testing1!",
         },
      }).then((authResponse) => {
         expect(authResponse.status).to.eq(200);

         const token = authResponse.body.access_token;
         cy.setCookie("access_token", token);

         const userId = authResponse.body.user.id;

         cy.request({
            method: "POST",
            url: `${API_URL}/reviews`,
            body: {
               restaurant_id: 1,
               user_id: userId,
               rating: 5,
               comment:
                  "This is a programmatic E2E test review!",
               tags: [],
               photo_urls: [],
            },
         }).then((postResponse) => {
            expect(postResponse.status).to.eq(201);

            cy.request({
               method: "DELETE",
               url: `${API_URL}/reviews/${postResponse.body.id}`,
               body: { user_id: userId },
            });
         });
      });
   });
});
