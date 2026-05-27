const { defineConfig } = require("cypress");
require("dotenv").config({ path: "./frontend/.env" });

if (
   !process.env.VITE_SUPABASE_URL ||
   !process.env.VITE_SUPABASE_ANON_KEY
) {
   throw new Error(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables in frontend/.env",
   );
}

module.exports = defineConfig({
   env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY:
         process.env.VITE_SUPABASE_ANON_KEY,
      TEST_EMAIL: process.env.TEST_EMAIL,
      TEST_PASSWORD: process.env.TEST_PASSWORD,
   },

   e2e: {
      setupNodeEvents(on, config) {},
   },
});
