import { z } from "zod";

// Schema for the 'restaurants' table
// .nullable() allows the field to be null from the database
// .default([]) means if the value is null, fall back to an empty array
// This prevents Zod validation errors when a restaurant has no tags/hours/images yet
export const Restaurant = z.object({
   id: z.number(),
   location: z.string().nullable(),
   name: z.string().nullable(),

   // Array fields default to [] if null so Zod doesn't throw
   // "expected array, received null" validation errors
   tags: z.array(z.string()).nullable().default([]),
   hours: z.array(z.string()).nullable().default([]),
   image_urls: z.array(z.string()).nullable().default([]),

   rating_count: z.number().nullable(),
   rating_sum: z.number().nullable(),
   avg_rating: z.number().nullable(),
});

// Schema for the 'bookmarks' table
export const Bookmark = z.object({
   user_id: z.string().uuid(),
   restaurant_id: z.number(),
});
