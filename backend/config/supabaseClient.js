import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
   throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SECRET_KEY in backend/.env",
   );
}

export const supabase = createClient(
   supabaseUrl,
   supabaseKey,
);
