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

describe("User Endpoints", () => {
   beforeEach(() => {
      jest.clearAllMocks();
   });

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
      expect(res.body.length).toBe(2);
      expect(res.body[0].name).toBe("Eli");
      expect(supabase.from).toHaveBeenCalledWith("users");
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
         "/api/users/uuid-999",
      );

      expect(res.statusCode).toBe(404);
   });
});
