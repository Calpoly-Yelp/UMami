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
import express from "express";
import uploadsRouter from "../routes/uploads.js";
import { supabase } from "../config/supabaseClient.js";

// Mock the supabase client
jest.mock("../config/supabaseClient.js");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/uploads", uploadsRouter);

describe("Uploads Endpoints", () => {
   let consoleErrorSpy;

   beforeAll(() => {
      // Suppress error logs in test output to keep the console clean
      consoleErrorSpy = jest
         .spyOn(console, "error")
         .mockImplementation(() => {});
   });

   afterAll(() => {
      consoleErrorSpy.mockRestore();
   });

   beforeEach(() => {
      jest.clearAllMocks();

      // Setup default mock structure for storage
      supabase.storage = {
         from: jest.fn().mockReturnValue({
            upload: jest
               .fn()
               .mockResolvedValue({ error: null }),
            getPublicUrl: jest.fn().mockReturnValue({
               data: {
                  publicUrl: "http://example.com/image.png",
               },
            }),
            remove: jest
               .fn()
               .mockResolvedValue({ error: null }),
         }),
      };

      // Setup default mock structure for database updates
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         single: jest.fn().mockResolvedValue({
            data: { name: "Test User" },
            error: null,
         }),
         update: jest.fn().mockReturnThis(),
      });
   });

   // -----------------------------------
   // POST /api/uploads/review-photo
   // -----------------------------------
   describe("POST /api/uploads/review-photo", () => {
      it("should upload a review photo successfully", async () => {
         const res = await request(app)
            .post("/api/uploads/review-photo")
            .attach(
               "file",
               Buffer.from("fake image"),
               "test.jpg",
            );

         expect(res.statusCode).toBe(201);
         expect(res.body.url).toBe(
            "http://example.com/image.png",
         );
         expect(supabase.storage.from).toHaveBeenCalledWith(
            "review-photos",
         );
      });

      it("should return 400 if no file is provided", async () => {
         const res = await request(app).post(
            "/api/uploads/review-photo",
         );

         expect(res.statusCode).toBe(400);
         expect(res.body.error).toBe("No file provided");
      });

      it("should handle upload errors", async () => {
         supabase.storage.from.mockReturnValueOnce({
            upload: jest.fn().mockResolvedValue({
               error: new Error("Upload Failed"),
            }),
         });

         const res = await request(app)
            .post("/api/uploads/review-photo")
            .attach(
               "file",
               Buffer.from("fake image"),
               "test.jpg",
            );

         expect(res.statusCode).toBe(500);
         expect(res.body.error).toBe("Upload Failed");
      });
   });

   // -----------------------------------
   // POST /api/uploads/profile-photo
   // -----------------------------------
   describe("POST /api/uploads/profile-photo", () => {
      it("should upload a profile photo successfully with a user_id", async () => {
         const res = await request(app)
            .post("/api/uploads/profile-photo")
            .field("user_id", "user123")
            .attach(
               "file",
               Buffer.from("fake image"),
               "avatar.png",
            );

         expect(res.statusCode).toBe(201);
         expect(res.body.url).toBe(
            "http://example.com/image.png",
         );
         expect(supabase.storage.from).toHaveBeenCalledWith(
            "profile-photos",
         );
      });

      it("should upload a profile photo successfully without a user_id (timestamp fallback)", async () => {
         const res = await request(app)
            .post("/api/uploads/profile-photo")
            .attach(
               "file",
               Buffer.from("fake image"),
               "avatar.png",
            );

         expect(res.statusCode).toBe(201);
         expect(res.body.url).toBe(
            "http://example.com/image.png",
         );
      });

      it("should return 400 if no file is provided", async () => {
         const res = await request(app).post(
            "/api/uploads/profile-photo",
         );

         expect(res.statusCode).toBe(400);
         expect(res.body.error).toBe("No file provided");
      });

      it("should handle profile photo upload errors", async () => {
         supabase.storage.from.mockReturnValueOnce({
            upload: jest.fn().mockResolvedValue({
               error: new Error("Profile Upload Failed"),
            }),
         });

         const res = await request(app)
            .post("/api/uploads/profile-photo")
            .attach(
               "file",
               Buffer.from("fake image"),
               "test.jpg",
            );

         expect(res.statusCode).toBe(500);
         expect(res.body.error).toBe(
            "Profile Upload Failed",
         );
      });
   });

   // -----------------------------------
   // DELETE /api/uploads/profile-photo/:userId
   // -----------------------------------
   describe("DELETE /api/uploads/profile-photo/:userId", () => {
      it("should remove all profile photo extensions and revert to ui-avatars default", async () => {
         const res = await request(app).delete(
            "/api/uploads/profile-photo/user123",
         );

         expect(res.statusCode).toBe(200);
         expect(res.body.message).toBe(
            "Profile photo removed",
         );
         // Verify standard URL encoding logic is handled
         expect(res.body.avatar_url).toBe(
            "https://ui-avatars.com/api/?name=Test%20User",
         );
         expect(supabase.storage.from).toHaveBeenCalledWith(
            "profile-photos",
         );
      });

      it("should revert to an empty string if the user has no name in the database", async () => {
         supabase.from.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
               data: { name: null },
               error: null,
            }),
            update: jest.fn().mockReturnThis(),
         });

         const res = await request(app).delete(
            "/api/uploads/profile-photo/user123",
         );

         expect(res.statusCode).toBe(200);
         expect(res.body.avatar_url).toBe("");
      });

      it("should handle storage deletion or database errors", async () => {
         // Mocking an error thrown somewhere in the logic
         supabase.storage.from.mockImplementationOnce(
            () => {
               throw new Error("Delete Request Failed");
            },
         );

         const res = await request(app).delete(
            "/api/uploads/profile-photo/user123",
         );

         expect(res.statusCode).toBe(500);
         expect(res.body.error).toBe(
            "Delete Request Failed",
         );
      });
   });
});
