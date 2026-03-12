import { z } from "zod";

// Schema for the 'notifications' table
export const Notification = z.object({
   id: z.string().uuid(),
   user_id: z.string().uuid(),
   type: z.string(),
   message: z.string(),
   related_id: z.string().uuid().nullable(),
   is_read: z.boolean().nullable(),
   created_at: z.string().nullable(),
});
