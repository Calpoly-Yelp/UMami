import { z } from "zod";

// Schema for the 'reviews' table
export const Review = z.object({
   id: z.number(),
   restaurant_id: z.number().nullable(),
   user_id: z.string().uuid().nullable(),
   created_at: z.string(),
   rating: z.number().nullable(),
   comment: z.string().nullable(),
   photo_urls: z.array(z.string()).nullable(),
   tags: z.array(z.string()).nullable(),
});
