import {
   describe,
   it,
   expect,
   jest,
   beforeEach,
   beforeAll,
   afterAll,
} from "@jest/globals";
import request from "supertest";
import app from "../index.js";
import { z } from "zod";
import { supabase } from "../config/supabaseClient.js";

// Mock the shared Supabase client used by the routes
jest.mock("../config/supabaseClient.js");

describe("User Endpoints", () => {
   beforeAll(() => {
      // Keep test output clean
      jest
         .spyOn(console, "log")
         .mockImplementation(() => {});
      jest
         .spyOn(console, "error")
         .mockImplementation(() => {});
   });

   afterAll(() => {
      console.error.mockRestore();
      console.log.mockRestore();
   });

   beforeEach(() => {
      jest.clearAllMocks();
   });

   // -----------------------------------
   // GET /api/users
   // -----------------------------------

   it("GET /api/users should return a list of users", async () => {
      const mockUsers = [
         {
            id: "b677be85-81db-4245-91ca-acb713bd5564",
            email: "eli@example.com",
            password_hash: "hash1",
            created_at: "2023-01-01",
            name: "Eli",
            avatar_url: null,
            is_verified: false,
         },
         {
            id: "c788cf96-92ec-5356-a2db-bdc824ce6675",
            email: "jane@example.com",
            password_hash: "hash2",
            created_at: "2023-01-02",
            name: "Jane",
            avatar_url: null,
            is_verified: true,
         },
      ];

      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         limit: jest.fn().mockResolvedValue({
            data: mockUsers,
            error: null,
         }),
      });

      const res = await request(app).get("/api/users");

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].name).toBe("Eli");
      expect(supabase.from).toHaveBeenCalledWith("users");
   });

   it("GET /api/users should handle null data gracefully", async () => {
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         limit: jest.fn().mockResolvedValue({
            data: null,
            error: null,
         }),
      });

      const res = await request(app).get("/api/users");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
   });

   it("GET /api/users should handle errors", async () => {
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         limit: jest
            .fn()
            .mockRejectedValue(new Error("Database error")),
      });

      const res = await request(app).get("/api/users");

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: "Database error" });
   });

   it("GET /api/users should throw on returned DB error", async () => {
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         limit: jest.fn().mockResolvedValue({
            data: null,
            error: { message: " returned error" },
         }),
      });

      const res = await request(app).get("/api/users");

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({
         error: " returned error",
      });
   });

   it("GET /api/users should catch unexpected errors", async () => {
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         limit: jest.fn().mockImplementation(() => {
            throw new Error("Unexpected error");
         }),
      });

      const res = await request(app).get("/api/users");

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Unexpected error");
   });

   it("GET /api/users should handle errors without a message", async () => {
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         limit: jest.fn().mockResolvedValue({
            data: null,
            error: {}, // No message property
         }),
      });

      const res = await request(app).get("/api/users");

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Internal Server Error");
   });

   it("POST /api/users should create a new user", async () => {
      const newUser = {
         id: "b677be85-81db-4245-91ca-acb713bd5564",
         email: "new@example.com",
         name: "New User",
         avatar_url: null,
         is_verified: false,
         created_at: new Date().toISOString(),
      };

      const insertedUser = {
         ...newUser,
         password_hash: null,
      };

      supabase.from.mockReturnValue({
         insert: jest.fn().mockReturnThis(),
         select: jest.fn().mockReturnThis(),
         single: jest.fn().mockResolvedValue({
            data: insertedUser,
            error: null,
         }),
      });

      const res = await request(app)
         .post("/api/users")
         .send(newUser);

      expect(res.statusCode).toBe(201);
      expect(res.body).toMatchObject(newUser);
      expect(res.body.password_hash).toBeUndefined();
   });

   it("POST /api/users should handle creation errors", async () => {
      const newUser = {
         id: "b677be85-81db-4245-91ca-acb713bd5564",
         email: "new@example.com",
         name: "New User",
         avatar_url: null,
         is_verified: false,
         created_at: new Date().toISOString(),
      };

      supabase.from.mockReturnValue({
         insert: jest.fn().mockReturnThis(),
         select: jest.fn().mockReturnThis(),
         single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Creation error" },
         }),
      });

      const res = await request(app)
         .post("/api/users")
         .send(newUser);

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: "Creation error" });
   });

   it("POST /api/users should handle creation errors without a message", async () => {
      const newUser = {
         id: "b677be85-81db-4245-91ca-acb713bd5564",
         email: "new@example.com",
         name: "New User",
         avatar_url: null,
         is_verified: false,
         created_at: new Date().toISOString(),
      };

      supabase.from.mockReturnValue({
         insert: jest.fn().mockReturnThis(),
         select: jest.fn().mockReturnThis(),
         single: jest.fn().mockResolvedValue({
            data: null,
            error: {}, // No message property
         }),
      });

      const res = await request(app)
         .post("/api/users")
         .send(newUser);

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Internal Server Error");
   });

   it("GET /api/users/:id should return a single user", async () => {
      const mockUser = {
         id: "b677be85-81db-4245-91ca-acb713bd5564",
         email: "eli@example.com",
         password_hash: "hash1",
         created_at: "2023-01-01",
         name: "Eli",
         avatar_url: null,
         is_verified: false,
      };

      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         single: jest.fn().mockResolvedValue({
            data: mockUser,
            error: null,
         }),
      });

      const res = await request(app).get(
         "/api/users/b677be85-81db-4245-91ca-acb713bd5564",
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe("Eli");
   });

   it("GET /api/users/:id should handle missing optional fields in user data", async () => {
      const mockUser = {
         id: "b677be85-81db-4245-91ca-acb713bd5564",
         email: "eli@example.com",
         created_at: "2023-01-01",
         // missing name, avatar_url, is_verified, password_hash
      };

      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         single: jest.fn().mockResolvedValue({
            data: mockUser,
            error: null,
         }),
      });

      const res = await request(app).get(
         "/api/users/b677be85-81db-4245-91ca-acb713bd5564",
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBeNull();
      expect(res.body.avatar_url).toBeNull();
      expect(res.body.is_verified).toBeNull();
   }, 10000);

   it("GET /api/users/:id should return 404 if user not found", async () => {
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST116" },
         }),
      });

      const res = await request(app).get(
         "/api/users/550e8400-e29b-41d4-a716-446655440000",
      );

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ error: "User not found" });
   });

   it("GET /api/users/:id should handle generic errors", async () => {
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Generic error" },
         }),
      });

      const res = await request(app).get(
         "/api/users/550e8400-e29b-41d4-a716-446655440001",
      );

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: "Generic error" });
   });

   it("GET /api/users/:id should handle errors without a message", async () => {
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         single: jest.fn().mockResolvedValue({
            data: null,
            error: {}, // No message property
         }),
      });

      const res = await request(app).get(
         "/api/users/550e8400-e29b-41d4-a716-446655440009",
      );
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Internal Server Error");
   });

   it("GET /api/users/:id should handle null user data and Zod error", async () => {
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         single: jest.fn().mockResolvedValue({
            data: null,
            error: null, // No DB error, but data is null
         }),
      });

      const res = await request(app).get(
         "/api/users/550e8400-e29b-41d4-a716-446655440009",
      );

      expect(res.statusCode).toBe(400); // User.parse(null) triggers Zod error
   });

   it("GET /api/users/:id should return 400 for invalid UUID", async () => {
      const res = await request(app).get(
         "/api/users/invalid-uuid",
      );
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Invalid user id format");
   });

   it("GET /api/users/:id should handle ZodError without issues gracefully", async () => {
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         single: jest.fn().mockResolvedValue({
            data: null,
            error: new z.ZodError([]),
         }),
      });

      const res = await request(app).get(
         "/api/users/b677be85-81db-4245-91ca-acb713bd5564",
      );

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Invalid request");
   });

   // -----------------------------------
   // PATCH /api/users/:id
   // -----------------------------------

   it("PATCH /api/users/:id should update a user's fields", async () => {
      const mockUser = {
         id: "b677be85-81db-4245-91ca-acb713bd5564",
         email: "eli@example.com",
         created_at: "2023-01-01",
         name: "Updated Name",
         avatar_url: "http://example.com/avatar.png",
         is_verified: false,
      };

      const mockQuery = {
         update: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         select: jest.fn().mockReturnThis(),
         single: jest.fn().mockResolvedValue({
            data: mockUser,
            error: null,
         }),
      };
      supabase.from.mockReturnValue(mockQuery);

      const res = await request(app)
         .patch(
            "/api/users/b677be85-81db-4245-91ca-acb713bd5564",
         )
         .send({
            name: "Updated Name",
            avatar_url: "http://example.com/avatar.png",
            extra: "ignored",
         });

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe("Updated Name");
      expect(res.body.avatar_url).toBe(
         "http://example.com/avatar.png",
      );
      expect(mockQuery.update).toHaveBeenCalledWith({
         name: "Updated Name",
         avatar_url: "http://example.com/avatar.png",
      });
   });

   it("PATCH /api/users/:id should return 400 if no valid fields to update", async () => {
      const res = await request(app)
         .patch(
            "/api/users/b677be85-81db-4245-91ca-acb713bd5564",
         )
         .send({ extra: "ignored" });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe(
         "No valid fields to update",
      );
   });

   it("PATCH /api/users/:id should return 404 if user not found", async () => {
      supabase.from.mockReturnValue({
         update: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         select: jest.fn().mockReturnThis(),
         single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST116" },
         }),
      });

      const res = await request(app)
         .patch(
            "/api/users/b677be85-81db-4245-91ca-acb713bd5564",
         )
         .send({ name: "Updated Name" });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("User not found");
   });

   it("PATCH /api/users/:id should handle generic database errors", async () => {
      supabase.from.mockReturnValue({
         update: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         select: jest.fn().mockReturnThis(),
         single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Update Error" },
         }),
      });

      const res = await request(app)
         .patch(
            "/api/users/b677be85-81db-4245-91ca-acb713bd5564",
         )
         .send({ name: "Updated Name" });

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Update Error");
   });

   it("PATCH /api/users/:id should return 400 for invalid UUID", async () => {
      const res = await request(app)
         .patch("/api/users/invalid-uuid")
         .send({ name: "Updated Name" });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Invalid user id format");
   });

   it("PATCH /api/users/:id should handle ZodError without issues gracefully", async () => {
      supabase.from.mockReturnValue({
         update: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         select: jest.fn().mockReturnThis(),
         single: jest.fn().mockResolvedValue({
            data: null,
            error: new z.ZodError([]),
         }),
      });

      const res = await request(app)
         .patch(
            "/api/users/b677be85-81db-4245-91ca-acb713bd5564",
         )
         .send({ name: "Updated Name" });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Invalid request");
   });

   it("GET /api/users/:id/follows should return followed users", async () => {
      const followerId =
         "b677be85-81db-4245-91ca-acb713bd5564";
      const followingId1 =
         "c788cf96-92ec-5356-a2db-bdc824ce6675";
      const followingId2 =
         "d899df07-03fd-6467-b3ec-ced935df7786";

      const mockFollows = [
         {
            follower_id: followerId,
            following_id: followingId1,
         },
         {
            follower_id: followerId,
            following_id: followingId2,
         },
      ];

      const mockFollowingUsers = [
         { id: followingId1, name: "Jane" },
         { id: followingId2, name: "Bob" },
      ];

      const mockReviews = [
         { user_id: followingId1 },
         { user_id: followingId1 },
         { user_id: followingId2 },
      ];

      supabase.from.mockImplementation((table) => {
         if (table === "follows") {
            return {
               select: jest.fn().mockReturnThis(),
               eq: jest.fn().mockResolvedValue({
                  data: mockFollows,
                  error: null,
               }),
            };
         }

         if (table === "users") {
            return {
               select: jest.fn().mockReturnThis(),
               in: jest.fn().mockResolvedValue({
                  data: mockFollowingUsers,
                  error: null,
               }),
            };
         }

         if (table === "reviews") {
            return {
               select: jest.fn().mockReturnThis(),
               in: jest.fn().mockResolvedValue({
                  data: mockReviews,
                  error: null,
               }),
            };
         }

         return { select: jest.fn() };
      });

      const res = await request(app).get(
         `/api/users/${followerId}/follows`,
      );

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].name).toBe("Jane");
      expect(res.body[0].numReviews).toBe(2);
      expect(res.body[1].name).toBe("Bob");
      expect(res.body[1].numReviews).toBe(1);
   });

   it("GET /api/users/:id/follows should return 0 for numReviews if a user has no reviews", async () => {
      const followerId =
         "b677be85-81db-4245-91ca-acb713bd5564";
      const followingId =
         "c788cf96-92ec-5356-a2db-bdc824ce6675";

      supabase.from.mockImplementation((table) => {
         if (table === "follows") {
            return {
               select: jest.fn().mockReturnThis(),
               eq: jest.fn().mockResolvedValue({
                  data: [
                     {
                        follower_id: followerId,
                        following_id: followingId,
                     },
                  ],
                  error: null,
               }),
            };
         }

         if (table === "users") {
            return {
               select: jest.fn().mockReturnThis(),
               in: jest.fn().mockResolvedValue({
                  data: [{ id: followingId, name: "Jane" }],
                  error: null,
               }),
            };
         }

         if (table === "reviews") {
            return {
               select: jest.fn().mockReturnThis(),
               in: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
               }),
            };
         }

         return { select: jest.fn() };
      });

      const res = await request(app).get(
         `/api/users/${followerId}/follows`,
      );

      expect(res.statusCode).toBe(200);
      expect(res.body[0].numReviews).toBe(0);
   });

   it("GET /api/users/:id/follows should handle fetch follows error", async () => {
      const followerId =
         "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

      supabase.from.mockImplementation((table) => {
         if (table === "follows") {
            return {
               select: jest.fn().mockReturnThis(),
               eq: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: "Fetch follows error" },
               }),
            };
         }

         return { select: jest.fn() };
      });

      const res = await request(app).get(
         `/api/users/${followerId}/follows`,
      );

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({
         error: "Fetch follows error",
      });
   });

   it("GET /api/users/:id/follows should return empty list if no follows", async () => {
      const followerId =
         "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

      supabase.from.mockImplementation((table) => {
         if (table === "follows") {
            return {
               select: jest.fn().mockReturnThis(),
               eq: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
               }),
            };
         }

         return { select: jest.fn() };
      });

      const res = await request(app).get(
         `/api/users/${followerId}/follows`,
      );

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
   });

   it("GET /api/users/:id/follows should handle fetch users error", async () => {
      const followerId =
         "b677be85-81db-4245-91ca-acb713bd5564";
      const followingId =
         "c788cf96-92ec-5356-a2db-bdc824ce6675";

      supabase.from.mockImplementation((table) => {
         if (table === "follows") {
            return {
               select: jest.fn().mockReturnThis(),
               eq: jest.fn().mockResolvedValue({
                  data: [
                     {
                        follower_id: followerId,
                        following_id: followingId,
                     },
                  ],
                  error: null,
               }),
            };
         }

         if (table === "users") {
            return {
               select: jest.fn().mockReturnThis(),
               in: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: "Fetch users error" },
               }),
            };
         }

         return { select: jest.fn() };
      });

      const res = await request(app).get(
         `/api/users/${followerId}/follows`,
      );

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({
         error: "Fetch users error",
      });
   });

   it("GET /api/users/:id/follows should handle fetch reviews error", async () => {
      const followerId =
         "b677be85-81db-4245-91ca-acb713bd5564";
      const followingId =
         "c788cf96-92ec-5356-a2db-bdc824ce6675";

      supabase.from.mockImplementation((table) => {
         if (table === "follows") {
            return {
               select: jest.fn().mockReturnThis(),
               eq: jest.fn().mockResolvedValue({
                  data: [
                     {
                        follower_id: followerId,
                        following_id: followingId,
                     },
                  ],
                  error: null,
               }),
            };
         }

         if (table === "users") {
            return {
               select: jest.fn().mockReturnThis(),
               in: jest.fn().mockResolvedValue({
                  data: [{ id: followingId, name: "Jane" }],
                  error: null,
               }),
            };
         }

         if (table === "reviews") {
            return {
               select: jest.fn().mockReturnThis(),
               in: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: "Fetch reviews error" },
               }),
            };
         }

         return { select: jest.fn() };
      });

      const res = await request(app).get(
         `/api/users/${followerId}/follows`,
      );

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({
         error: "Fetch reviews error",
      });
   });

   it("GET /api/users/:id/follows should handle errors without a message", async () => {
      const followerId =
         "550e8400-e29b-41d4-a716-446655440002";

      supabase.from.mockImplementation((table) => {
         if (table === "follows") {
            return {
               select: jest.fn().mockReturnThis(),
               eq: jest.fn().mockResolvedValue({
                  data: null,
                  error: {}, // No message property
               }),
            };
         }
         return { select: jest.fn() };
      });

      const res = await request(app).get(
         `/api/users/${followerId}/follows`,
      );
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Internal Server Error");
   });

   it("GET /api/users/:id/follows should return 400 for invalid UUID", async () => {
      const res = await request(app).get(
         "/api/users/invalid-uuid/follows",
      );
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Invalid user id format");
   });

   it("GET /api/users/:id/follows should handle null followingUsers data gracefully", async () => {
      const followerId =
         "b677be85-81db-4245-91ca-acb713bd5564";
      const followingId =
         "c788cf96-92ec-5356-a2db-bdc824ce6675";

      supabase.from.mockImplementation((table) => {
         if (table === "follows") {
            return {
               select: jest.fn().mockReturnThis(),
               eq: jest.fn().mockResolvedValue({
                  data: [
                     {
                        follower_id: followerId,
                        following_id: followingId,
                     },
                  ],
                  error: null,
               }),
            };
         }

         if (table === "users") {
            return {
               select: jest.fn().mockReturnThis(),
               in: jest.fn().mockResolvedValue({
                  data: null, // Null users data
                  error: null,
               }),
            };
         }

         if (table === "reviews") {
            return {
               select: jest.fn().mockReturnThis(),
               in: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
               }),
            };
         }

         return { select: jest.fn() };
      });

      const res = await request(app).get(
         `/api/users/${followerId}/follows`,
      );

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
   });

   it("GET /api/users/:id/follows should handle Zod validation error on follows data", async () => {
      const followerId =
         "b677be85-81db-4245-91ca-acb713bd5564";

      supabase.from.mockImplementation((table) => {
         if (table === "follows") {
            return {
               select: jest.fn().mockReturnThis(),
               eq: jest.fn().mockResolvedValue({
                  data: [
                     {
                        follower_id: followerId,
                        // missing following_id triggers Zod error
                     },
                  ],
                  error: null,
               }),
            };
         }

         return { select: jest.fn() };
      });

      const res = await request(app).get(
         `/api/users/${followerId}/follows`,
      );

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe(
         "Invalid input: expected string, received undefined",
      );
   });

   it("GET /api/users/:id/follows should handle null reviewsData gracefully", async () => {
      const followerId =
         "b677be85-81db-4245-91ca-acb713bd5564";
      const followingId =
         "c788cf96-92ec-5356-a2db-bdc824ce6675";

      supabase.from.mockImplementation((table) => {
         if (table === "follows") {
            return {
               select: jest.fn().mockReturnThis(),
               eq: jest.fn().mockResolvedValue({
                  data: [
                     {
                        follower_id: followerId,
                        following_id: followingId,
                     },
                  ],
                  error: null,
               }),
            };
         }

         if (table === "users") {
            return {
               select: jest.fn().mockReturnThis(),
               in: jest.fn().mockResolvedValue({
                  data: [{ id: followingId, name: "Jane" }],
                  error: null,
               }),
            };
         }

         if (table === "reviews") {
            return {
               select: jest.fn().mockReturnThis(),
               in: jest.fn().mockResolvedValue({
                  data: null, // Null reviewsData
                  error: null,
               }),
            };
         }

         return { select: jest.fn() };
      });

      const res = await request(app).get(
         `/api/users/${followerId}/follows`,
      );

      expect(res.statusCode).toBe(200);
      expect(res.body[0].numReviews).toBe(0);
   });

   it("GET /api/users/:id/follows should handle ZodError without issues gracefully", async () => {
      const followerId =
         "b677be85-81db-4245-91ca-acb713bd5564";

      supabase.from.mockImplementation((table) => {
         if (table === "follows") {
            return {
               select: jest.fn().mockReturnThis(),
               eq: jest.fn().mockResolvedValue({
                  data: null,
                  error: new z.ZodError([]),
               }),
            };
         }
         return { select: jest.fn() };
      });

      const res = await request(app).get(
         `/api/users/${followerId}/follows`,
      );

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Invalid request");
   });

   it("POST /api/users/follows/sync should sync follows", async () => {
      const followerId =
         "b677be85-81db-4245-91ca-acb713bd5564";
      const added = [
         "c788cf96-92ec-5356-a2db-bdc824ce6675",
      ];
      const removed = [
         "d899df07-03fd-6467-b3ec-ced935df7786",
      ];

      const mockInsert = jest
         .fn()
         .mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockIn = jest
         .fn()
         .mockResolvedValue({ error: null });

      supabase.from.mockReturnValue({
         insert: mockInsert,
         delete: mockDelete,
         eq: mockEq,
         in: mockIn,
      });

      const res = await request(app)
         .post("/api/users/follows/sync")
         .send({ follower_id: followerId, added, removed });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe(
         "Follows synced successfully",
      );
   });

   it("POST /api/users/follows/sync should sync only added", async () => {
      const followerId =
         "b677be85-81db-4245-91ca-acb713bd5564";
      const added = [
         "c788cf96-92ec-5356-a2db-bdc824ce6675",
      ];

      const mockInsert = jest
         .fn()
         .mockResolvedValue({ error: null });

      supabase.from.mockReturnValue({
         insert: mockInsert,
         delete: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         in: jest.fn().mockResolvedValue({ error: null }),
      });

      const res = await request(app)
         .post("/api/users/follows/sync")
         .send({ follower_id: followerId, added });

      expect(res.statusCode).toBe(200);
      expect(mockInsert).toHaveBeenCalled();
   });

   it("POST /api/users/follows/sync should sync only removed", async () => {
      const followerId =
         "b677be85-81db-4245-91ca-acb713bd5564";
      const removed = [
         "d899df07-03fd-6467-b3ec-ced935df7786",
      ];

      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockIn = jest
         .fn()
         .mockResolvedValue({ error: null });

      supabase.from.mockReturnValue({
         insert: jest
            .fn()
            .mockResolvedValue({ error: null }),
         delete: mockDelete,
         eq: mockEq,
         in: mockIn,
      });

      const res = await request(app)
         .post("/api/users/follows/sync")
         .send({ follower_id: followerId, removed });

      expect(res.statusCode).toBe(200);
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith(
         "follower_id",
         followerId,
      );
      expect(mockIn).toHaveBeenCalledWith(
         "following_id",
         removed,
      );
   });

   it("POST /api/users/follows/sync should handle errors", async () => {
      const followerId =
         "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
      const added = [
         "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      ];

      const mockInsert = jest
         .fn()
         .mockRejectedValue(new Error("Sync error"));

      supabase.from.mockReturnValue({
         insert: mockInsert,
         delete: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         in: jest.fn().mockResolvedValue({ error: null }),
      });

      const res = await request(app)
         .post("/api/users/follows/sync")
         .send({ follower_id: followerId, added });

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: "Sync error" });
   });

   it("POST /api/users/follows/sync should handle errors without a message", async () => {
      const followerId =
         "550e8400-e29b-41d4-a716-446655440002";
      const added = [
         "550e8400-e29b-41d4-a716-446655440003",
      ];

      const mockInsert = jest.fn().mockRejectedValue({}); // Throwing an empty object

      supabase.from.mockReturnValue({
         insert: mockInsert,
         delete: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         in: jest.fn().mockResolvedValue({ error: null }),
      });

      const res = await request(app)
         .post("/api/users/follows/sync")
         .send({ follower_id: followerId, added });

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Internal Server Error");
   });

   it("POST /api/users/follows/sync should throw insertError when insert fails", async () => {
      const followerId =
         "b677be85-81db-4245-91ca-acb713bd5564";
      const added = [
         "c788cf96-92ec-5356-a2db-bdc824ce6675",
      ];

      const mockInsert = jest.fn().mockResolvedValue({
         error: { message: "Insert Error" },
      });

      supabase.from.mockReturnValue({
         insert: mockInsert,
         delete: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         in: jest.fn().mockResolvedValue({ error: null }),
      });

      const res = await request(app)
         .post("/api/users/follows/sync")
         .send({ follower_id: followerId, added });

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Insert Error");
   });

   it("POST /api/users/follows/sync should throw deleteError when delete fails", async () => {
      const followerId =
         "b677be85-81db-4245-91ca-acb713bd5564";
      const removed = [
         "c788cf96-92ec-5356-a2db-bdc824ce6675",
      ];

      const mockIn = jest.fn().mockResolvedValue({
         error: { message: "Delete Error" },
      });

      supabase.from.mockReturnValue({
         insert: jest
            .fn()
            .mockResolvedValue({ error: null }),
         delete: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         in: mockIn,
      });

      const res = await request(app)
         .post("/api/users/follows/sync")
         .send({ follower_id: followerId, removed });

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Delete Error");
   });

   it("POST /api/users/follows/sync should return 400 for invalid body payload", async () => {
      const res = await request(app)
         .post("/api/users/follows/sync")
         .send({ follower_id: "not-a-uuid" });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Invalid follower_id");
   });

   it("POST /api/users/follows/sync should handle ZodError without issues gracefully", async () => {
      const followerId =
         "b677be85-81db-4245-91ca-acb713bd5564";
      const added = [
         "c788cf96-92ec-5356-a2db-bdc824ce6675",
      ];

      supabase.from.mockReturnValue({
         insert: jest.fn().mockResolvedValue({
            error: new z.ZodError([]),
         }),
         delete: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         in: jest.fn().mockResolvedValue({ error: null }),
      });

      const res = await request(app)
         .post("/api/users/follows/sync")
         .send({ follower_id: followerId, added });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Invalid request");
   });
});
