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

describe("Restaurant Endpoints", () => {
   beforeEach(() => {
      jest.clearAllMocks();
   });

   it("GET /api/restaurants should return a list of restaurants", async () => {
      const mockRestaurants = [
         {
            id: 1,
            name: "Restaurant A",
            location: "Location A",
            category: ["Italian"],
            tags: ["Italian"],
            hours: ["9-5"],
            image_urls: [],
            rating_count: 10,
            rating_sum: 45,
            avg_rating: 4.5,
         },
         {
            id: 2,
            name: "Restaurant B",
            location: "Location B",
            category: ["Mexican"],
            tags: ["Mexican"],
            hours: ["10-6"],
            image_urls: [],
            rating_count: 8,
            rating_sum: 32,
            avg_rating: 4.0,
         },
      ];

      supabase.from.mockReturnValue({
         select: jest.fn().mockResolvedValue({
            data: mockRestaurants,
            error: null,
         }),
      });

      const res = await request(app).get(
         "/api/restaurants",
      );

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(
         expect.arrayContaining([
            expect.objectContaining({
               name: "Restaurant A",
               tags: ["Italian"],
            }),
         ]),
      );
      expect(supabase.from).toHaveBeenCalledWith(
         "restaurants",
      );
   });

   it("GET /api/restaurants should handle errors", async () => {
      supabase.from.mockReturnValue({
         select: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Fetch Error" },
         }),
      });

      const res = await request(app).get(
         "/api/restaurants",
      );

      expect(res.statusCode).toBe(500);
   });

   it("GET /api/restaurants/:id should return a single restaurant if found", async () => {
      const mockRestaurant = {
         id: 1,
         name: "Restaurant A",
         location: "Location A",
         category: ["Italian"],
         tags: ["Italian"],
         hours: ["9-5"],
         image_urls: [],
         rating_count: 10,
         rating_sum: 45,
         avg_rating: 4.5,
      };

      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         single: jest.fn().mockResolvedValue({
            data: mockRestaurant,
            error: null,
         }),
      });

      const res = await request(app).get(
         "/api/restaurants/1",
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe("Restaurant A");
      expect(res.body.tags).toEqual(["Italian"]);
      expect(supabase.from).toHaveBeenCalledWith(
         "restaurants",
      );
   });

   it("GET /api/restaurants/:id should return 404 if not found", async () => {
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         single: jest
            .fn()
            .mockResolvedValue({ data: null, error: null }),
      });

      const res = await request(app).get(
         "/api/restaurants/999",
      );

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Restaurant not found");
   });

   it("GET /api/restaurants/:id should handle errors", async () => {
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "DB Error" },
         }),
      });

      const res = await request(app).get(
         "/api/restaurants/1",
      );

      expect(res.statusCode).toBe(500);
   });

   it("GET /api/restaurants/:id/tags should return tags for a single restaurant", async () => {
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         single: jest.fn().mockResolvedValue({
            data: { tags: ["Acai", "Smoothies", "Toast"] },
            error: null,
         }),
      });

      const res = await request(app).get(
         "/api/restaurants/1/tags",
      );

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([
         "Acai",
         "Smoothies",
         "Toast",
      ]);
      expect(supabase.from).toHaveBeenCalledWith(
         "restaurants",
      );
   });

   it("GET /api/restaurants/:id/tags should return empty array if tags are null", async () => {
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         single: jest.fn().mockResolvedValue({
            data: { tags: null },
            error: null,
         }),
      });

      const res = await request(app).get(
         "/api/restaurants/1/tags",
      );
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
   });

   it("GET /api/restaurants/:id/tags should return 404 if not found", async () => {
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         single: jest
            .fn()
            .mockResolvedValue({ data: null, error: null }),
      });

      const res = await request(app).get(
         "/api/restaurants/999/tags",
      );
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Restaurant not found");
   });

   it("GET /api/restaurants/:id/tags should handle errors", async () => {
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "DB Error" },
         }),
      });
      const res = await request(app).get(
         "/api/restaurants/1/tags",
      );
      expect(res.statusCode).toBe(500);
   });

   it("GET /api/restaurants/bookmarks/:userId should return bookmarked restaurants", async () => {
      const mockBookmarks = [
         { restaurant_id: 1 },
         { restaurant_id: 2 },
      ];

      const mockRestaurants = [
         {
            id: 1,
            name: "Restaurant A",
            location: "Location A",
            tags: ["Italian"],
            hours: ["9-5"],
            image_urls: [],
            rating_count: 10,
            rating_sum: 45,
            avg_rating: 4.5,
         },
         {
            id: 2,
            name: "Restaurant B",
            location: "Location B",
            tags: ["Mexican"],
            hours: ["10-6"],
            image_urls: [],
            rating_count: 8,
            rating_sum: 32,
            avg_rating: 4.0,
         },
      ];

      supabase.from.mockImplementation((table) => {
         if (table === "bookmarks") {
            return {
               select: jest.fn().mockReturnThis(),
               eq: jest.fn().mockResolvedValue({
                  data: mockBookmarks,
                  error: null,
               }),
            };
         }

         if (table === "restaurants") {
            return {
               select: jest.fn().mockReturnThis(),
               in: jest.fn().mockResolvedValue({
                  data: mockRestaurants,
                  error: null,
               }),
            };
         }

         return { select: jest.fn() };
      });

      const res = await request(app).get(
         "/api/restaurants/bookmarks/user123",
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].name).toBe("Restaurant A");
   });

   it("GET /api/restaurants/bookmarks/:userId should handle errors", async () => {
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Bookmark Error" },
         }),
      });

      const res = await request(app).get(
         "/api/restaurants/bookmarks/user1",
      );

      expect(res.statusCode).toBe(500);
   });

   it("GET /api/restaurants/bookmarks should return all bookmarks", async () => {
      supabase.from.mockReturnValue({
         select: jest.fn().mockResolvedValue({
            data: [
               {
                  user_id:
                     "b677be85-81db-4245-91ca-acb713bd5564",
                  restaurant_id: 101,
               },
            ],
            error: null,
         }),
      });

      const res = await request(app).get(
         "/api/restaurants/bookmarks",
      );

      expect(res.statusCode).toBe(200);
      expect(res.body[0].user_id).toBe(
         "b677be85-81db-4245-91ca-acb713bd5564",
      );
   });

   it("GET /api/restaurants/bookmarks should handle errors", async () => {
      supabase.from.mockReturnValue({
         select: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Fetch Error" },
         }),
      });

      const res = await request(app).get(
         "/api/restaurants/bookmarks",
      );

      expect(res.statusCode).toBe(500);
   });

   it("POST /api/restaurants/bookmarks should add a bookmark", async () => {
      supabase.from.mockReturnValue({
         insert: jest.fn().mockResolvedValue({
            data: { id: 1 },
            error: null,
         }),
      });

      const res = await request(app)
         .post("/api/restaurants/bookmarks")
         .send({ user_id: "u1", restaurant_id: 101 });

      expect(res.statusCode).toBe(201);
   });

   it("POST /api/restaurants/bookmarks should handle errors", async () => {
      supabase.from.mockReturnValue({
         insert: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Insert Error" },
         }),
      });

      const res = await request(app)
         .post("/api/restaurants/bookmarks")
         .send({});

      expect(res.statusCode).toBe(500);
   });

   it("POST /api/restaurants/bookmarks should catch unexpected exceptions", async () => {
      supabase.from.mockImplementation(() => {
         throw new Error("Unexpected crash");
      });

      const res = await request(app)
         .post("/api/restaurants/bookmarks")
         .send({});

      expect(res.statusCode).toBe(500);
   });

   it("POST /api/restaurants/bookmarks/sync should sync added and removed bookmarks", async () => {
      const mockDelete = jest.fn().mockReturnThis();
      const mockInsert = jest
         .fn()
         .mockResolvedValue({ error: null });

      supabase.from.mockReturnValue({
         delete: mockDelete,
         eq: jest.fn().mockReturnThis(),
         in: jest.fn().mockResolvedValue({ error: null }),
         insert: mockInsert,
      });

      const res = await request(app)
         .post("/api/restaurants/bookmarks/sync")
         .send({
            user_id: "b677be85-81db-4245-91ca-acb713bd5564",
            added: [101],
            removed: [202],
         });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Sync successful");
      expect(mockDelete).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalled();
   });

   it("POST /api/restaurants/bookmarks/sync should sync only added", async () => {
      const mockInsert = jest
         .fn()
         .mockResolvedValue({ error: null });

      supabase.from.mockReturnValue({
         delete: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         in: jest.fn().mockResolvedValue({ error: null }),
         insert: mockInsert,
      });

      const res = await request(app)
         .post("/api/restaurants/bookmarks/sync")
         .send({
            user_id: "b677be85-81db-4245-91ca-acb713bd5564",
            added: [101],
         });

      expect(res.statusCode).toBe(200);
      expect(mockInsert).toHaveBeenCalled();
   });

   it("POST /api/restaurants/bookmarks/sync should sync only removed", async () => {
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockIn = jest
         .fn()
         .mockResolvedValue({ error: null });

      supabase.from.mockReturnValue({
         delete: mockDelete,
         eq: mockEq,
         in: mockIn,
         insert: jest
            .fn()
            .mockResolvedValue({ error: null }),
      });

      const res = await request(app)
         .post("/api/restaurants/bookmarks/sync")
         .send({
            user_id: "b677be85-81db-4245-91ca-acb713bd5564",
            removed: [202],
         });

      expect(res.statusCode).toBe(200);
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith(
         "user_id",
         "b677be85-81db-4245-91ca-acb713bd5564",
      );
      expect(mockIn).toHaveBeenCalledWith(
         "restaurant_id",
         [202],
      );
   });

   it("POST /api/restaurants/bookmarks/sync should handle errors", async () => {
      supabase.from.mockReturnValue({
         delete: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         in: jest.fn().mockResolvedValue({
            error: { message: "Sync Error" },
         }),
      });

      const res = await request(app)
         .post("/api/restaurants/bookmarks/sync")
         .send({
            user_id: "b677be85-81db-4245-91ca-acb713bd5564",
            removed: [1],
         });

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Sync Error");
   });

   it("POST /api/restaurants/bookmarks/sync should handle insert errors", async () => {
      supabase.from.mockReturnValue({
         delete: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         in: jest.fn().mockResolvedValue({ error: null }),
         insert: jest.fn().mockResolvedValue({
            error: { message: "Insert Failed" },
         }),
      });

      const res = await request(app)
         .post("/api/restaurants/bookmarks/sync")
         .send({
            user_id: "b677be85-81db-4245-91ca-acb713bd5564",
            added: [101],
         });

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Insert Failed");
   });
});