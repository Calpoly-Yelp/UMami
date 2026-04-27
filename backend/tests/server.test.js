import {
   describe,
   it,
   expect,
   jest,
   beforeEach,
   afterEach,
} from "@jest/globals";

process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SECRET_KEY = "test-secret";

// Prevent dotenv from loading .env file which interferes with tests
jest.mock("dotenv/config", () => {});

// Mock express to capture listen
const mockListen = jest.fn((port, cb) => {
   if (cb) {
      cb();
   }
});
jest.mock("express", () => {
   const mockRouter = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      use: jest.fn(),
   };
   const mockApp = {
      use: jest.fn(),
      get: jest.fn(),
      listen: mockListen,
   };
   const expressMock = jest.fn(() => mockApp);
   expressMock.Router = jest.fn(() => mockRouter);
   expressMock.json = jest.fn();
   return {
      __esModule: true,
      default: expressMock,
   };
});

describe("Server Startup", () => {
   beforeEach(() => {
      jest.resetModules();
      mockListen.mockClear();
   });
   afterEach(() => {
      jest.resetModules();
   });

   it("should start server when NOT in test mode", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development"; // Simulate non-test env

      // We need to suppress console.log for this test
      const logSpy = jest
         .spyOn(console, "log")
         .mockImplementation(() => {});

      await import("../index.js");

      expect(mockListen).toHaveBeenCalled();

      logSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
   });

   it("should use custom PORT from env", async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalPort = process.env.PORT;

      process.env.NODE_ENV = "development";
      process.env.PORT = "5000";

      const logSpy = jest
         .spyOn(console, "log")
         .mockImplementation(() => {});

      await import("../index.js");

      expect(mockListen).toHaveBeenCalledWith(
         "5000",
         expect.any(Function),
      );

      logSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
      process.env.PORT = originalPort;
   });

   it("should default to PORT 4000 if env is missing", async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalPort = process.env.PORT;

      process.env.NODE_ENV = "development";
      delete process.env.PORT;

      const logSpy = jest
         .spyOn(console, "log")
         .mockImplementation(() => {});

      await import("../index.js");

      expect(mockListen).toHaveBeenCalledWith(
         4000,
         expect.any(Function),
      );

      logSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
      if (originalPort) {
         process.env.PORT = originalPort;
      }
   });
});
