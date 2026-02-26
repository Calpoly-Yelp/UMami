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
      // Clear all mocks before each test to ensure isolation
      jest.clearAllMocks();
   });

   it("GET /api/restaurants should return a list of restaurants", async () => {
      const mockRestaurants = [
         {
            id: 1,
            name: "Restaurant A",
            location: "Location A",
            category: ["Italian"],
            avg_rating: 4.5,
            hours: ["9-5"],
            image_urls: [],
         },
         {
            id: 2,
            name: "Restaurant B",
            location: "Location B",
            category: ["Mexican"],
            avg_rating: 4.0,
            hours: ["10-6"],
            image_urls: [],
         },
      ];

      // Mock the chained Supabase call
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
            }),
         ]),
      );
      expect(supabase.from).toHaveBeenCalledWith(
         "restaurants",
      );
   });

   it("GET /api/restaurants/:id should return a single restaurant if found", async () => {
      const mockRestaurant = {
         id: 1,
         name: "Restaurant A",
         location: "Location A",
         category: ["Italian"],
         avg_rating: 4.5,
         hours: ["9-5"],
         image_urls: [],
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
      expect(supabase.from).toHaveBeenCalledWith(
         "restaurants",
      );
   });

   it("GET /api/restaurants/:id should return 404 if not found", async () => {
      // Mock Supabase returning no data
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

   it("GET /api/restaurants/bookmarks/:userId should return bookmarked restaurants", async () => {
      const mockBookmarks = [
         { restaurant_id: 1 },
         { restaurant_id: 2 },
      ];
      const mockRestaurants = [
         { id: 1, name: "Restaurant A" },
         { id: 2, name: "Restaurant B" },
      ];

      // Mock implementation to handle different table calls
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

   it("POST /api/restaurants/bookmarks/sync should sync added and removed bookmarks", async () => {
      // Mock delete and insert chains
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
            user_id: "user123",
            added: [101],
            removed: [202],
         });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Sync successful");
      // Verify delete was called
      expect(mockDelete).toHaveBeenCalled();
      // Verify insert was called
      expect(mockInsert).toHaveBeenCalled();
   });
});
