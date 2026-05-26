const { defineConfig } = require("cypress");
require("dotenv").config({ path: "./frontend/.env" });

module.exports = defineConfig({
   env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY:
         process.env.VITE_SUPABASE_ANON_KEY,
   },

   e2e: {
      setupNodeEvents(on, config) {},
   },
});
