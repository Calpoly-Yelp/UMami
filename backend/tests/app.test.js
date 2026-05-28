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

   it("GET / should return API running status", async () => {
      const res = await request(app).get("/");
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("UMami API is running!");
   });
});

describe("Server Initialization", () => {
   const OLD_ENV = process.env;

   beforeEach(() => {
      process.env = { ...OLD_ENV };
   });

   afterEach(() => {
      process.env = OLD_ENV;
      jest.restoreAllMocks();
   });

   it("should use process.env.PORT when defined", () => {
      process.env.NODE_ENV = "development";
      process.env.PORT = "5000";

      jest.isolateModules(() => {
         const express = require("express");
         const listenSpy = jest
            .spyOn(express.application, "listen")
            .mockImplementation((port, cb) => {
               if (cb) {
                  cb();
               }
               return { close: jest.fn() };
            });

         const scraper = require("../utils/scrapeCurrentMenus.js");
         jest
            .spyOn(scraper, "scheduleCurrentMenuScraper")
            .mockImplementation(() => {});

         const consoleLogSpy = jest
            .spyOn(console, "log")
            .mockImplementation(() => {});

         require("../index.js");

         expect(listenSpy).toHaveBeenCalledWith(
            "5000",
            expect.any(Function),
         );
         expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining("5000"),
         );
      });
   });

   it("should default to port 4000 when process.env.PORT is not set", () => {
      process.env.NODE_ENV = "development";
      process.env.PORT = ""; // Prevents dotenv from overriding while forcing the falsy fallback

      jest.isolateModules(() => {
         const express = require("express");
         const listenSpy = jest
            .spyOn(express.application, "listen")
            .mockImplementation((port, cb) => {
               if (cb) {
                  cb();
               }
               return { close: jest.fn() };
            });

         const scraper = require("../utils/scrapeCurrentMenus.js");
         jest
            .spyOn(scraper, "scheduleCurrentMenuScraper")
            .mockImplementation(() => {});

         const consoleLogSpy = jest
            .spyOn(console, "log")
            .mockImplementation(() => {});

         require("../index.js");

         expect(listenSpy).toHaveBeenCalledWith(
            4000,
            expect.any(Function),
         );
         expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining("4000"),
         );
      });
   });
});
