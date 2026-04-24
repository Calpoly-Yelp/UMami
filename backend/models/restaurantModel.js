import { z } from "zod";

// Schema for the 'restaurants' table
export const Restaurant = z.object({
   id: z.number(),
   location: z.string().nullable(),
   name: z.string().nullable(),
   tags: z.array(z.string()).nullable(),
   hours: z.array(z.string()).nullable(),
   image_urls: z.array(z.string()).nullable(),
   rating_count: z.number().nullable(),
   rating_sum: z.number().nullable(),
   avg_rating: z.number().nullable(),
   lat: z.number().nullable().optional(),
   lng: z.number().nullable().optional(),
   street_address: z.string().nullable().optional(),
});

// Schema for the 'bookmarks' table
export const Bookmark = z.object({
   user_id: z.string().uuid(),
   restaurant_id: z.number(),
});
