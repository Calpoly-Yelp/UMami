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
      supabase.from.mockReturnValue({
         select: jest.fn().mockResolvedValue({
            data: mockReviews,
            error: null,
         }),
      });

      const res = await request(app).get("/api/reviews");

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].comment).toBe("Great!");
      expect(supabase.from).toHaveBeenCalledWith("reviews");
   });
});
