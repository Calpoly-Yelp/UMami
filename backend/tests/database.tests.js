import { describe, it, expect } from "@jest/globals";s
import request from "supertest";
import app from "../index.js";

describe("GET /api/restaurants", () => {
   it("should return a 200 status and a list of Cal Poly eats", async () => {
      const res = await request(app).get(
         "/api/restaurants",
      );

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("restaurants");
   });
});
