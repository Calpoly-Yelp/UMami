import dotenv from "dotenv";

// 1. Force dotenv to load your real .env file into process.env first
dotenv.config();

// 2. Only provide the mock URL if the .env file didn't have one
if (!process.env.SUPABASE_URL) {
   process.env.SUPABASE_URL = "https://mock.supabase.co";
}

if (!process.env.SUPABASE_SECRET_KEY) {
   process.env.SUPABASE_SECRET_KEY = "mock-secret-key";
}
