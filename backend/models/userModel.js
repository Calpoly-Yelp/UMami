import { z } from "zod";

// Schema for the 'users' table
export const User = z.object({
   id: z.string().uuid(),
   email: z.string().email(),
   password_hash: z.string(),
   created_at: z.string(),
   name: z.string().nullable(),
   avatar_url: z.string().nullable(),
   is_verified: z.boolean().nullable(),
});
