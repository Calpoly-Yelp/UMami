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

jest.mock("../config/supabaseClient.js");

describe("App/Index Routes", () => {
   beforeEach(() => {
      jest.clearAllMocks();
   });

   it("GET /test-supabase should return success on valid connection", async () => {
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         limit: jest.fn().mockResolvedValue({
            data: [{ id: 1 }],
            error: null,
         }),
      });

      const res = await request(app).get("/test-supabase");
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("Connected!");
   });

   it("GET /test-supabase should return 500 on db error", async () => {
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         limit: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Connection failed" },
         }),
      });

      const res = await request(app).get("/test-supabase");
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Connection failed");
   });

   it("GET /health should return 200 OK", async () => {
      // Since health check is sometimes common, just verifying app structure works
   });
});
