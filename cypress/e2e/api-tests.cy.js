describe("Backend API Tests", () => {
   const API_URL = "http://localhost:4000/api";

   // Requirement: One GET request skipping the UI
   it("GET /api/restaurants should return a list of restaurants", () => {
      cy.request("GET", `${API_URL}/restaurants`).then(
         (response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.be.an("array");
            // If you have data seeded, you can uncomment this:
            // expect(response.body.length).to.be.greaterThan(0);
         },
      );
   });

   // Requirement: One POST request skipping the UI
   it("POST /api/notifications should create a new notification", () => {
      const newNotification = {
         user_id: "b677be85-81db-4245-91ca-acb713bd5564", // Valid UUID matching your DB schema
         type: "test_alert",
         message:
            "This is an automated E2E test notification",
      };

      cy.request(
         "POST",
         `${API_URL}/notifications`,
         newNotification,
      ).then((response) => {
         expect(response.status).to.eq(201);
         expect(response.body).to.have.property("id");
         expect(response.body.message).to.eq(
            newNotification.message,
         );
      });
   });
});
