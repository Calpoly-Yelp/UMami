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
   hours: z
      .array(z.string().nullable())
      .nullable()
      .default([]),
   image_urls: z.array(z.string()).nullable().default([]),

   rating_count: z.number().nullable(),
   rating_sum: z.number().nullable(),
   avg_rating: z.number().nullable(),
   lat: z.number().nullable().optional(),
   lng: z.number().nullable().optional(),
   location_mapping: z.any().nullable().optional(),
   menu_source_url: z.string().nullable().optional(),
});

// Schema for the 'bookmarks' table
export const Bookmark = z.object({
   user_id: z.string().uuid(),
   restaurant_id: z.number(),
});

// Schema for the 'menu_items' table
export const MenuItem = z.object({
   id: z.number(),
   restaurant_id: z.number(),
   category: z.string().nullable(),
   name: z.string(),
   description: z.string().nullable().optional(),
   portion: z.string().nullable().optional(),
   price: z.coerce.number().nullable().optional(),
   calories: z.number().nullable().optional(),
   fat: z.string().nullable().optional(),
   carbs: z.string().nullable().optional(),
   protein: z.string().nullable().optional(),
   allergens: z.array(z.string()).nullable().default([]),
   dietary_tags: z.array(z.string()).nullable().default([]),
   source_url: z.string().nullable().optional(),
   meal_period: z.string().nullable().optional(),
   last_scraped_at: z.string().nullable().optional(),
   created_at: z.string().nullable().optional(),
});
