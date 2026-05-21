import {
   describe,
   it,
   expect,
   beforeAll,
   afterAll,
   jest,
} from "@jest/globals";
import request from "supertest";
import crypto from "crypto";
import app from "../index.js";
import { supabase } from "../config/supabaseClient.js";

// Notice that we do NOT mock supabaseClient here!
// This test suite will interact with the actual database.

describe("User Endpoints Integration Tests", () => {
   const userA = {
      id: crypto.randomUUID(),
      email: `testA-${Date.now()}@example.com`,
      name: "Integration Test User A",
      created_at: new Date().toISOString(),
      is_verified: false,
   };
   const userB = {
      id: crypto.randomUUID(),
      email: `testB-${Date.now()}@example.com`,
      name: "Integration Test User B",
      created_at: new Date().toISOString(),
      is_verified: true,
   };
   const userC = {
      id: crypto.randomUUID(),
      email: `testC-${Date.now()}@example.com`,
      name: "Integration Test User C",
      created_at: new Date().toISOString(),
      is_verified: false,
   };

   beforeAll(async () => {
      // Pre-insert B and C to act as targets for follows.
      // A will be created via the POST /api/users test.
      await supabase.from("users").insert([userB, userC]);

      // Suppress console.log and console.error during tests to keep output clean
      jest
         .spyOn(console, "log")
         .mockImplementation(() => {});
      jest
         .spyOn(console, "error")
         .mockImplementation(() => {});
   });

   afterAll(async () => {
      // Clean up to prevent DB pollution
      await supabase
         .from("follows")
         .delete()
         .in("follower_id", [userA.id, userB.id, userC.id]);
      await supabase
         .from("users")
         .delete()
         .in("id", [userA.id, userB.id, userC.id]);

      console.log.mockRestore();
      console.error.mockRestore();
   });

   // -----------------------------------
   // GET /api/users
   // -----------------------------------

   it("GET /api/users should return a list of users from the database", async () => {
      const res = await request(app).get("/api/users");

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
   });

   // -----------------------------------
   // POST /api/users
   // -----------------------------------

   it("POST /api/users should create a new user in the database", async () => {
      const res = await request(app)
         .post("/api/users")
         .send(userA);

      expect(res.statusCode).toBe(201);
      expect(res.body.id).toBe(userA.id);
      expect(res.body.email).toBe(userA.email);
      expect(res.body.name).toBe("Integration Test User A");
   });

   it("POST /api/users should handle creation errors (duplicate)", async () => {
      // Attempting to create the exact same user again should trigger a DB error
      const res = await request(app)
         .post("/api/users")
         .send(userA);
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBeDefined();
   });

   // -----------------------------------
   // GET /api/users/:id
   // -----------------------------------

   it("GET /api/users/:id should return the created user", async () => {
      const res = await request(app).get(
         `/api/users/${userA.id}`,
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(userA.id);
      expect(res.body.name).toBe("Integration Test User A");
   });

   it("GET /api/users/:id should return 404 for a non-existent user", async () => {
      const randomId = crypto.randomUUID();
      const res = await request(app).get(
         `/api/users/${randomId}`,
      );

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("User not found");
   });

   it("GET /api/users/:id should handle generic errors", async () => {
      // Trigger a validation error by using an invalid UUID format
      const res = await request(app).get(
         `/api/users/not-a-uuid`,
      );
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBeDefined();
   });

   // -----------------------------------
   // GET /api/users/:id/follows
   // -----------------------------------

   it("GET /api/users/:id/follows should return empty list if no follows", async () => {
      const res = await request(app).get(
         `/api/users/${userA.id}/follows`,
      );
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
   });

   // -----------------------------------
   // POST /api/users/follows/sync
   // -----------------------------------

   it("POST /api/users/follows/sync should sync only added", async () => {
      const payload = {
         follower_id: userA.id,
         added: [userB.id],
      };
      const res = await request(app)
         .post("/api/users/follows/sync")
         .send(payload);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe(
         "Follows synced successfully",
      );
   });

   it("GET /api/users/:id/follows should return 0 for numReviews if a user has no reviews", async () => {
      const res = await request(app).get(
         `/api/users/${userA.id}/follows`,
      );
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(userB.id);
      expect(res.body[0].numReviews).toBe(0); // We haven't created any reviews, so this should naturally be 0
   });

   it("POST /api/users/follows/sync should sync follows (add and remove)", async () => {
      // A is currently following B. Let's add C and remove B.
      const payload = {
         follower_id: userA.id,
         added: [userC.id],
         removed: [userB.id],
      };
      const res = await request(app)
         .post("/api/users/follows/sync")
         .send(payload);
      expect(res.statusCode).toBe(200);
   });

   it("GET /api/users/:id/follows should return followed users", async () => {
      const res = await request(app).get(
         `/api/users/${userA.id}/follows`,
      );
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(userC.id);
   });

   it("POST /api/users/follows/sync should sync only removed", async () => {
      const payload = {
         follower_id: userA.id,
         removed: [userC.id],
      };
      const res = await request(app)
         .post("/api/users/follows/sync")
         .send(payload);
      expect(res.statusCode).toBe(200);

      // Verify removal
      const verify = await request(app).get(
         `/api/users/${userA.id}/follows`,
      );
      expect(verify.body).toEqual([]);
   });

   it("POST /api/users/follows/sync should handle errors", async () => {
      // Trigger a validation error by sending an invalid UUID
      const payload = {
         follower_id: "not-a-uuid",
         added: [userB.id],
      };
      const res = await request(app)
         .post("/api/users/follows/sync")
         .send(payload);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBeDefined();
   });
});
