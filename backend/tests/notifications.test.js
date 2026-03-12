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

describe("Notification Endpoints", () => {
   beforeEach(() => {
      jest.clearAllMocks();
   });

   // --- Success Tests ---

   // test endpoint for returning notification based on userid
   it("GET /api/notifications/:userId should return notifications", async () => {
      const userId = "c788cf96-92ec-5356-a2db-bdc824ce6675";
      const mockNotifications = [
         {
            id: "b677be85-81db-4245-91ca-acb713bd5564",
            user_id: userId,
            type: "like",
            message: "Test 1",
            related_id: null,
            is_read: false,
            created_at: "2023-01-01T00:00:00Z",
         },
         {
            id: "d899df07-03fd-6467-b3ec-ced935df7786",
            user_id: userId,
            type: "comment",
            message: "Test 2",
            related_id: null,
            is_read: true,
            created_at: "2023-01-02T00:00:00Z",
         },
      ];
      const mockOrder = jest.fn().mockResolvedValue({
         data: mockNotifications,
         error: null,
      });
      const mockEq = jest
         .fn()
         .mockReturnValue({ order: mockOrder });
      const mockSelect = jest
         .fn()
         .mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ select: mockSelect });

      const res = await request(app).get(
         `/api/notifications/${userId}`,
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(2);
      expect(supabase.from).toHaveBeenCalledWith(
         "notifications",
      );
   });

   // test to see a notification is read or not
   it("PATCH /api/notifications/:id/read should mark as read", async () => {
      const mockUpdated = [
         {
            id: "b677be85-81db-4245-91ca-acb713bd5564",
            user_id: "c788cf96-92ec-5356-a2db-bdc824ce6675",
            type: "like",
            message: "Test 1",
            related_id: null,
            is_read: true,
            created_at: "2023-01-01T00:00:00Z",
         },
      ];
      const mockSelect = jest.fn().mockResolvedValue({
         data: mockUpdated,
         error: null,
      });
      const mockEq = jest
         .fn()
         .mockReturnValue({ select: mockSelect });
      const mockUpdate = jest
         .fn()
         .mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ update: mockUpdate });

      const res = await request(app).patch(
         "/api/notifications/b677be85-81db-4245-91ca-acb713bd5564/read",
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.is_read).toBe(true);
   });

   // test enpoint to mark all notifications as read
   it("PATCH /api/notifications/:userId/read-all should mark all as read", async () => {
      const mockEq = jest
         .fn()
         .mockResolvedValue({ error: null });
      const mockUpdate = jest
         .fn()
         .mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ update: mockUpdate });

      const res = await request(app).patch(
         "/api/notifications/user123/read-all",
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain("marked as read");
   });

   // endpoint test for deleting a notifcation
   it("DELETE /api/notifications/:id should delete notification", async () => {
      const mockEq = jest
         .fn()
         .mockResolvedValue({ error: null });
      const mockDelete = jest
         .fn()
         .mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ delete: mockDelete });

      const res = await request(app).delete(
         "/api/notifications/b677be85-81db-4245-91ca-acb713bd5564",
      );

      expect(res.statusCode).toBe(200);
   });

   // enpoint teset for deleting all notifications
   it("DELETE /api/notifications/:userId/delete-all should delete all", async () => {
      const mockEq = jest
         .fn()
         .mockResolvedValue({ error: null });
      const mockDelete = jest
         .fn()
         .mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ delete: mockDelete });

      const res = await request(app).delete(
         "/api/notifications/user123/delete-all",
      );

      expect(res.statusCode).toBe(200);
   });

   // --- Error Handling Tests ---

   it("GET /api/notifications/:userId should handle errors", async () => {
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "DB Error" },
         }),
      });

      const res = await request(app).get(
         "/api/notifications/user1",
      );
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: "DB Error" });
   });

   it("PATCH /api/notifications/:userId/read-all should handle errors", async () => {
      supabase.from.mockReturnValue({
         update: jest.fn().mockReturnThis(),
         eq: jest.fn().mockResolvedValue({
            error: { message: "Update Error" },
         }),
      });

      const res = await request(app).patch(
         "/api/notifications/user1/read-all",
      );
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: "Update Error" });
   });

   it("DELETE /api/notifications/:userId/delete-all should handle errors", async () => {
      supabase.from.mockReturnValue({
         delete: jest.fn().mockReturnThis(),
         eq: jest.fn().mockResolvedValue({
            error: { message: "Delete Error" },
         }),
      });

      const res = await request(app).delete(
         "/api/notifications/user1/delete-all",
      );
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: "Delete Error" });
   });

   it("PATCH /api/notifications/:id/read should handle errors", async () => {
      supabase.from.mockReturnValue({
         update: jest.fn().mockReturnThis(),
         eq: jest.fn().mockReturnThis(),
         select: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Read Error" },
         }),
      });

      const res = await request(app).patch(
         "/api/notifications/notif1/read",
      );
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: "Read Error" });
   });

   it("DELETE /api/notifications/:id should handle errors", async () => {
      supabase.from.mockReturnValue({
         delete: jest.fn().mockReturnThis(),
         eq: jest.fn().mockResolvedValue({
            error: { message: "Delete One Error" },
         }),
      });

      const res = await request(app).delete(
         "/api/notifications/notif1",
      );
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({
         error: "Delete One Error",
      });
   });
});
