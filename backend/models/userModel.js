import { z } from "zod";

// Schema for the 'users' table
export const User = z.object({
   id: z.string().uuid(),
   email: z.string().email(),
   password_hash: z.string().nullable().optional(),
   created_at: z.string(),
   name: z.string().nullable().optional(),
   avatar_url: z.string().nullable().optional(),
   is_verified: z.boolean().nullable().optional(),
});

// Schema for the 'follows' table
export const Follow = z.object({
   follower_id: z.string().uuid(),
   following_id: z.string().uuid(),
});
