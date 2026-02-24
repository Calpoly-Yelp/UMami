import { z } from "zod";

// Schema for the 'restaurants' table
export const Restaurant = z.object({
   id: z.number(),
   location: z.string().nullable(),
   name: z.string().nullable(),
   category: z.array(z.string()).nullable(),
   avg_rating: z.number().nullable(),
   hours: z.array(z.string()).nullable(),
   image_urls: z.array(z.string()).nullable(),
});

// Schema for the 'bookmarks' table
export const Bookmark = z.object({
   user_id: z.string().uuid(),
   restaurant_id: z.number(),
});
