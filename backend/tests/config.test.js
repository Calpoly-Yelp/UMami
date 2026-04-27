import {
   describe,
   it,
   expect,
   jest,
   beforeEach,
} from "@jest/globals";

describe("Supabase Config", () => {
   beforeEach(() => {
      jest.resetModules(); // Reset cache to re-execute the module
   });

   it("should throw error if env vars are missing", async () => {
      // Save original env
      const originalEnv = process.env;

      // Clear env vars
      process.env = { ...originalEnv };
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_PUBLISHABLE_KEY;

      try {
         await import("../config/supabaseClient.js");
      } catch (e) {
         expect(e.message).toBe(
            "Missing SUPABASE_URL or SUPABASE_SECRET_KEY in backend/.env",
         );
      }

      // Restore env
      process.env = originalEnv;
   });
});
