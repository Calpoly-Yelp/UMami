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

   // test endpoint for returning notification based on userid
   it("GET /api/notifications/:userId should return notifications", async () => {
      const mockNotifications = [
         { id: 1, message: "Test 1", is_read: false },
         { id: 2, message: "Test 2", is_read: true },
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
         "/api/notifications/user123",
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(2);
      expect(supabase.from).toHaveBeenCalledWith(
         "notifications",
      );
   });

   // test to see a notification is read or not
   it("PATCH /api/notifications/:id/read should mark as read", async () => {
      const mockUpdated = [{ id: 1, is_read: true }];
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
         "/api/notifications/1/read",
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
         "/api/notifications/1",
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
});
