import {
   describe,
   it,
   expect,
   jest,
   beforeEach,
} from "@jest/globals";
import request from "supertest";
import app from "../index.js";
import { supabase } from "../config/supabaseClient.js";

// Mock the supabase client
jest.mock("../config/supabaseClient.js");

describe("Review Endpoints", () => {
   beforeEach(() => {
      jest.clearAllMocks();
   });

   // --- Success Tests ---

   it("GET /api/reviews should return a list of reviews", async () => {
      const mockReviews = [
         {
            id: 1,
            restaurant_id: 101,
            user_id: "b677be85-81db-4245-91ca-acb713bd5564",
            created_at: "2023-01-01",
            rating: 5,
            comment: "Great!",
            photo_urls: [],
            tags: [],
         },
         {
            id: 2,
            restaurant_id: 102,
            user_id: "c788cf96-92ec-5356-a2db-bdc824ce6675",
            created_at: "2023-01-02",
            rating: 4,
            comment: "Awesome!",
            photo_urls: [],
            tags: [],
         },
      ];

      // Create a mock query object that supports chaining .eq() and is awaitable
      const mockQuery = {
         eq: jest.fn().mockReturnThis(),
         then: (resolve) =>
            resolve({ data: mockReviews, error: null }),
      };

      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnValue(mockQuery),
      });

      const res = await request(app).get("/api/reviews");

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].comment).toBe("Great!");
      expect(supabase.from).toHaveBeenCalledWith("reviews");
   });

   it("GET /api/reviews?current_user_id=... should attach has_voted_helpful", async () => {
      const mockReviews = [
         {
            id: 1,
            restaurant_id: 101,
            user_id: "b677be85-81db-4245-91ca-acb713bd5564",
            created_at: "2023-01-01",
            rating: 5,
            comment: "Great!",
            photo_urls: [],
            tags: [],
         },
      ];

      const mockQuery = {
         eq: jest.fn().mockReturnThis(),
         then: (resolve) =>
            resolve({ data: mockReviews, error: null }),
      };

      const mockVotesQuery = {
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         in: jest.fn().mockResolvedValue({
            data: [{ review_id: 1 }],
            error: null,
         }),
      };

      supabase.from.mockImplementation((table) => {
         if (table === "reviews") {
            return {
               select: jest.fn().mockReturnValue(mockQuery),
            };
         }
         if (table === "review_helpful_votes") {
            return mockVotesQuery;
         }
      });

      const res = await request(app).get(
         "/api/reviews?current_user_id=user123",
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].has_voted_helpful).toBe(true);
   });

   it("GET /api/reviews?user_id=... should filter reviews by user", async () => {
      const mockReviews = [
         {
            id: 1,
            restaurant_id: 101,
            user_id: "b677be85-81db-4245-91ca-acb713bd5564",
            created_at: "2023-01-01",
            rating: 5,
            comment: "Great!",
            photo_urls: [],
            tags: [],
         },
      ];

      const mockQuery = {
         eq: jest.fn().mockReturnThis(),
         then: (resolve) =>
            resolve({ data: mockReviews, error: null }),
      };

      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnValue(mockQuery),
      });

      const res = await request(app).get(
         "/api/reviews?user_id=b677be85-81db-4245-91ca-acb713bd5564",
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      expect(mockQuery.eq).toHaveBeenCalledWith(
         "user_id",
         "b677be85-81db-4245-91ca-acb713bd5564",
      );
   });

   it("GET /api/reviews?restaurant_id=... should filter reviews by restaurant", async () => {
      const mockReviews = [
         {
            id: 1,
            restaurant_id: 101,
            user_id: "b677be85-81db-4245-91ca-acb713bd5564",
            created_at: "2023-01-01",
            rating: 5,
            comment: "Great!",
            photo_urls: [],
            tags: [],
         },
      ];

      const mockQuery = {
         eq: jest.fn().mockReturnThis(),
         then: (resolve) =>
            resolve({ data: mockReviews, error: null }),
      };

      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnValue(mockQuery),
      });

      const res = await request(app).get(
         "/api/reviews?restaurant_id=101",
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      expect(mockQuery.eq).toHaveBeenCalledWith(
         "restaurant_id",
         "101",
      );
   });

   it("POST /api/reviews/:id/helpful should insert vote and rely on trigger for helpful_count", async () => {
      const mockQuery = {
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         insert: jest.fn().mockReturnThis(),
         delete: jest.fn().mockReturnThis(),
         maybeSingle: jest
            .fn()
            .mockResolvedValue({ data: null, error: null }),
         single: jest.fn().mockResolvedValue({
            data: { id: 1, helpful_count: 5 },
            error: null,
         }),
         then: jest
            .fn()
            .mockImplementation((resolve) =>
               resolve({ error: null }),
            ),
      };

      supabase.from.mockReturnValue(mockQuery);

      const res = await request(app)
         .post("/api/reviews/1/helpful")
         .send({ user_id: "user123" });

      expect(res.statusCode).toBe(200);
      expect(res.body.helpful_count).toBe(5);
      expect(res.body.has_voted_helpful).toBe(true);
      expect(mockQuery.insert).toHaveBeenCalledWith([
         { review_id: "1", user_id: "user123" },
      ]);
   });

   it("POST /api/reviews/:id/helpful should delete vote and rely on trigger for helpful_count", async () => {
      const mockQuery = {
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         insert: jest.fn().mockReturnThis(),
         delete: jest.fn().mockReturnThis(),
         maybeSingle: jest.fn().mockResolvedValue({
            data: { review_id: 1 },
            error: null,
         }),
         single: jest.fn().mockResolvedValue({
            data: { id: 1, helpful_count: 4 },
            error: null,
         }),
         then: jest
            .fn()
            .mockImplementation((resolve) =>
               resolve({ error: null }),
            ),
      };

      supabase.from.mockReturnValue(mockQuery);

      const res = await request(app)
         .post("/api/reviews/1/helpful")
         .send({ user_id: "user123" });

      expect(res.statusCode).toBe(200);
      expect(res.body.helpful_count).toBe(4);
      expect(res.body.has_voted_helpful).toBe(false);
   });

   it("GET /api/reviews?current_user_id=... should handle error when fetching votes", async () => {
      const mockReviews = [
         {
            id: 1,
            restaurant_id: 101,
            user_id: "b677be85-81db-4245-91ca-acb713bd5564",
            created_at: "2023-01-01",
            rating: 5,
            comment: "Great!",
            photo_urls: [],
            tags: [],
         },
      ];

      const mockQuery = {
         eq: jest.fn().mockReturnThis(),
         then: (resolve) =>
            resolve({ data: mockReviews, error: null }),
      };

      const mockVotesQuery = {
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         in: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Votes Error" },
         }),
      };

      supabase.from.mockImplementation((table) => {
         if (table === "reviews") {
            return {
               select: jest.fn().mockReturnValue(mockQuery),
            };
         }
         if (table === "review_helpful_votes") {
            return mockVotesQuery;
         }
      });

      const res = await request(app).get(
         "/api/reviews?current_user_id=user123",
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].has_voted_helpful).toBeUndefined();
   });

   it("POST /api/reviews should create a new review", async () => {
      const mockReview = {
         id: 3,
         restaurant_id: 101,
         user_id: "user123",
         rating: 5,
         comment: "Test",
      };
      const mockQuery = {
         insert: jest.fn().mockReturnThis(),
         select: jest.fn().mockReturnThis(),
         single: jest.fn().mockResolvedValue({
            data: mockReview,
            error: null,
         }),
      };

      supabase.from.mockReturnValue(mockQuery);

      const res = await request(app)
         .post("/api/reviews")
         .send({
            restaurant_id: 101,
            user_id: "user123",
            rating: 5,
            comment: "Test",
         });

      expect(res.statusCode).toBe(201);
      expect(res.body.comment).toBe("Test");
      expect(mockQuery.insert).toHaveBeenCalledWith([
         {
            restaurant_id: 101,
            user_id: "user123",
            rating: 5,
            comment: "Test",
            photo_urls: [],
            tags: [],
         },
      ]);
   });

   // --- Error Handling Tests ---

   it("GET /api/reviews should handle errors", async () => {
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "DB Error" },
         }),
         then: (resolve) =>
            resolve({
               data: null,
               error: { message: "DB Error" },
            }),
      });
      const res = await request(app).get("/api/reviews");
      expect(res.statusCode).toBe(500);
   });

   it("GET /api/reviews should handle errors without a message", async () => {
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockResolvedValue({
            data: null,
            error: {}, // No message property
         }),
         then: (resolve) =>
            resolve({
               data: null,
               error: {}, // No message property
            }),
      });
      const res = await request(app).get("/api/reviews");
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Internal Server Error");
   });

   it("POST /api/reviews/:id/helpful should return 400 if user_id is missing", async () => {
      const res = await request(app)
         .post("/api/reviews/1/helpful")
         .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("user_id is required");
   });

   it("POST /api/reviews/:id/helpful should handle DB errors", async () => {
      const mockQuery = {
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "DB Error" },
         }),
      };

      supabase.from.mockReturnValue(mockQuery);

      const res = await request(app)
         .post("/api/reviews/1/helpful")
         .send({ user_id: "user123" });

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("DB Error");
   });

   it("POST /api/reviews/:id/helpful should handle DB errors without a message", async () => {
      const mockQuery = {
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: {}, // No message property
         }),
      };

      supabase.from.mockReturnValue(mockQuery);

      const res = await request(app)
         .post("/api/reviews/1/helpful")
         .send({ user_id: "user123" });

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Internal Server Error");
   });

   it("POST /api/reviews/:id/helpful should handle DB error on delete", async () => {
      const mockQuery = {
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         delete: jest.fn().mockReturnThis(),
         maybeSingle: jest.fn().mockResolvedValue({
            data: { review_id: 1 },
            error: null,
         }),
         then: jest.fn().mockImplementation((resolve) =>
            resolve({
               error: { message: "Delete Error" },
            }),
         ),
      };

      supabase.from.mockReturnValue(mockQuery);

      const res = await request(app)
         .post("/api/reviews/1/helpful")
         .send({ user_id: "user123" });

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Delete Error");
   });

   it("POST /api/reviews/:id/helpful should handle DB error on insert", async () => {
      const mockQuery = {
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         insert: jest.fn().mockReturnThis(),
         maybeSingle: jest
            .fn()
            .mockResolvedValue({ data: null, error: null }),
         then: jest.fn().mockImplementation((resolve) =>
            resolve({
               error: { message: "Insert Error" },
            }),
         ),
      };

      supabase.from.mockReturnValue(mockQuery);

      const res = await request(app)
         .post("/api/reviews/1/helpful")
         .send({ user_id: "user123" });

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Insert Error");
   });

   it("POST /api/reviews/:id/helpful should handle DB error on fetching updated review", async () => {
      const mockQuery = {
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         insert: jest.fn().mockReturnThis(),
         maybeSingle: jest
            .fn()
            .mockResolvedValue({ data: null, error: null }),
         single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Fetch Error" },
         }),
         then: jest
            .fn()
            .mockImplementation((resolve) =>
               resolve({ error: null }),
            ),
      };

      supabase.from.mockReturnValue(mockQuery);

      const res = await request(app)
         .post("/api/reviews/1/helpful")
         .send({ user_id: "user123" });

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Fetch Error");
   });

   it("POST /api/reviews should return 400 if required fields are missing", async () => {
      const res = await request(app)
         .post("/api/reviews")
         .send({
            // Missing restaurant_id, user_id, rating
            comment: "Test",
         });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe(
         "Missing required fields",
      );
   });

   it("POST /api/reviews should handle DB errors on insert", async () => {
      const mockQuery = {
         insert: jest.fn().mockReturnThis(),
         select: jest.fn().mockReturnThis(),
         single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Insert Error" },
         }),
      };

      supabase.from.mockReturnValue(mockQuery);

      const res = await request(app)
         .post("/api/reviews")
         .send({
            restaurant_id: 101,
            user_id: "user123",
            rating: 5,
            comment: "Test",
         });

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Insert Error");
   });

   it("POST /api/reviews should handle DB errors on insert without a message", async () => {
      const mockQuery = {
         insert: jest.fn().mockReturnThis(),
         select: jest.fn().mockReturnThis(),
         single: jest.fn().mockResolvedValue({
            data: null,
            error: {}, // No message property
         }),
      };

      supabase.from.mockReturnValue(mockQuery);

      const res = await request(app)
         .post("/api/reviews")
         .send({
            restaurant_id: 101,
            user_id: "user123",
            rating: 5,
            comment: "Test",
         });

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Internal Server Error");
   });

   // --- DELETE /api/reviews/:id Tests ---

   it("DELETE /api/reviews/:id should delete a review if the user is the owner", async () => {
      const mockQuery = {
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         maybeSingle: jest.fn().mockResolvedValue({
            data: { user_id: "user123" },
            error: null,
         }),
         delete: jest.fn().mockReturnThis(),
         then: jest
            .fn()
            .mockImplementation((resolve) =>
               resolve({ error: null }),
            ),
      };

      supabase.from.mockReturnValue(mockQuery);

      const res = await request(app)
         .delete("/api/reviews/1")
         .send({ user_id: "user123" });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe(
         "Review deleted successfully",
      );
      expect(mockQuery.delete).toHaveBeenCalled();
   });

   it("DELETE /api/reviews/:id should return 400 if user_id is missing", async () => {
      const res = await request(app)
         .delete("/api/reviews/1")
         .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("user_id is required");
   });

   it("DELETE /api/reviews/:id should return 404 if review does not exist", async () => {
      const mockQuery = {
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: null,
         }),
      };

      supabase.from.mockReturnValue(mockQuery);

      const res = await request(app)
         .delete("/api/reviews/1")
         .send({ user_id: "user123" });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Review not found");
   });

   it("DELETE /api/reviews/:id should return 403 if user is not the owner", async () => {
      const mockQuery = {
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         maybeSingle: jest.fn().mockResolvedValue({
            data: { user_id: "differentUser" },
            error: null,
         }),
      };

      supabase.from.mockReturnValue(mockQuery);

      const res = await request(app)
         .delete("/api/reviews/1")
         .send({ user_id: "user123" });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe(
         "Unauthorized to delete this review",
      );
   });

   it("DELETE /api/reviews/:id should handle DB errors on fetch", async () => {
      const mockQuery = {
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Fetch Error" },
         }),
      };

      supabase.from.mockReturnValue(mockQuery);

      const res = await request(app)
         .delete("/api/reviews/1")
         .send({ user_id: "user123" });

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Fetch Error");
   });

   it("DELETE /api/reviews/:id should handle DB errors on delete", async () => {
      const mockQuery = {
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         maybeSingle: jest.fn().mockResolvedValue({
            data: { user_id: "user123" },
            error: null,
         }),
         delete: jest.fn().mockReturnThis(),
         then: jest.fn().mockImplementation((resolve) =>
            resolve({
               error: { message: "Delete Error" },
            }),
         ),
      };

      supabase.from.mockReturnValue(mockQuery);

      const res = await request(app)
         .delete("/api/reviews/1")
         .send({ user_id: "user123" });

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Delete Error");
   });

   it("DELETE /api/reviews/:id should handle DB errors on delete without a message", async () => {
      const mockQuery = {
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         maybeSingle: jest.fn().mockResolvedValue({
            data: { user_id: "user123" },
            error: null,
         }),
         delete: jest.fn().mockReturnThis(),
         then: jest.fn().mockImplementation((resolve) =>
            resolve({
               error: {}, // No message property
            }),
         ),
      };

      supabase.from.mockReturnValue(mockQuery);

      const res = await request(app)
         .delete("/api/reviews/1")
         .send({ user_id: "user123" });

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Internal Server Error");
   });
});
