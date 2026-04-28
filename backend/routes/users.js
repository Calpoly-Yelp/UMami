import express from "express";
import { z } from "zod";
import { supabase } from "../config/supabaseClient.js";
import { User, Follow } from "../models/userModel.js";

const router = express.Router();

/**
 * Small helper:
 * normalize a user row coming from Supabase before validating with Zod.
 * This helps avoid crashes if some optional DB fields are undefined.
 */
function normalizeUser(user) {
   if (!user) {
      return user;
   }

   return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash ?? null,
      created_at: user.created_at,
      name: user.name ?? null,
      avatar_url: user.avatar_url ?? null,
      is_verified: user.is_verified ?? null,
   };
}

/**
 * Small helper:
 * log backend errors in a consistent way and return a JSON error.
 */
function handleServerError(res, label, error) {
   console.error(`${label}:`, error);

   return res.status(500).json({
      error: error?.message || "Internal Server Error",
   });
}

/**
 * Validation schema for route params that contain a user id.
 * Supabase auth user ids are UUIDs.
 */
const userIdParamsSchema = z.object({
   id: z.string().uuid("Invalid user id format"),
});

/**
 * Validation schema for syncing follows.
 */
const syncFollowsSchema = z.object({
   follower_id: z.string().uuid("Invalid follower_id"),
   added: z.array(z.string().uuid()).optional().default([]),
   removed: z
      .array(z.string().uuid())
      .optional()
      .default([]),
});

// ===============================
// GET /api/users
// Get up to 50 users
// ===============================
router.get("/", async (req, res) => {
   try {
      const { data, error } = await supabase
         .from("users")
         .select("*")
         .limit(50);

      if (error) {
         throw error;
      }

      // Normalize every user row before returning.
      const normalizedUsers = (data || []).map(
         normalizeUser,
      );

      console.log("Fetched users:", normalizedUsers.length);
      return res.status(200).json(normalizedUsers);
   } catch (error) {
      return handleServerError(
         res,
         "Error fetching users",
         error,
      );
   }
});

// ===============================
// POST /api/users
// Create a new user profile row
// ===============================
router.post("/", async (req, res) => {
   try {
      // Insert the raw request body into the users table.
      // If you want, this can be tightened later with a create-user schema.
      const { data, error } = await supabase
         .from("users")
         .insert([req.body])
         .select()
         .single();

      if (error) {
         throw error;
      }

      const normalizedUser = normalizeUser(data);
      const validatedData = User.parse(normalizedUser);

      return res.status(201).json(validatedData);
   } catch (error) {
      return handleServerError(
         res,
         "Error creating user",
         error,
      );
   }
});

// ===============================
// GET /api/users/:id
// Get a single user by UUID
// ===============================
router.get("/:id", async (req, res) => {
   try {
      // Validate route param first so bad ids fail fast.
      const { id } = userIdParamsSchema.parse(req.params);

      const { data, error } = await supabase
         .from("users")
         .select("*")
         .eq("id", id)
         .single();

      if (error) {
         // PGRST116 = no rows found
         if (error.code === "PGRST116") {
            return res
               .status(404)
               .json({ error: "User not found" });
         }

         throw error;
      }

      // Normalize DB row before validating with Zod.
      const normalizedUser = normalizeUser(data);

      // IMPORTANT:
      // if validation fails, this will now clearly show in backend logs.
      const validatedData = User.parse(normalizedUser);

      return res.status(200).json(validatedData);
   } catch (error) {
      // If the UUID itself is invalid, return 400 instead of 500.
      if (error instanceof z.ZodError) {
         console.error(
            "Validation error fetching user:",
            error,
         );
         return res.status(400).json({
            error:
               error.errors?.[0]?.message ||
               "Invalid request",
         });
      }

      return handleServerError(
         res,
         "Error fetching user by id",
         error,
      );
   }
});

// ===============================
// GET /api/users/:id/follows
// Return all users that this user follows,
// plus their number of reviews
// ===============================
router.get("/:id/follows", async (req, res) => {
   try {
      const { id } = userIdParamsSchema.parse(req.params);

      // Step 1: get follow relationships
      const { data, error } = await supabase
         .from("follows")
         .select("*")
         .eq("follower_id", id);

      if (error) {
         throw error;
      }

      if (!data || data.length === 0) {
         return res.status(200).json([]);
      }

      // Validate follows from DB
      const validatedFollows = z.array(Follow).parse(data);

      const followingIds = validatedFollows.map(
         (follow) => follow.following_id,
      );

      // Step 2: fetch the followed users
      const { data: followingUsers, error: usersError } =
         await supabase
            .from("users")
            .select("*")
            .in("id", followingIds);

      if (usersError) {
         throw usersError;
      }

      // Step 3: fetch review counts for those users
      const { data: reviewsData, error: reviewsError } =
         await supabase
            .from("reviews")
            .select("user_id")
            .in("user_id", followingIds);

      if (reviewsError) {
         throw reviewsError;
      }

      // Build { user_id: count }
      const reviewCounts = (reviewsData || []).reduce(
         (acc, review) => {
            acc[review.user_id] =
               (acc[review.user_id] || 0) + 1;
            return acc;
         },
         {},
      );

      // Step 4: attach numReviews to each followed user
      const usersWithReviewCounts = (
         followingUsers || []
      ).map((user) => {
         const normalizedUser = normalizeUser(user);
         return {
            ...normalizedUser,
            numReviews: reviewCounts[user.id] || 0,
         };
      });

      return res.status(200).json(usersWithReviewCounts);
   } catch (error) {
      if (error instanceof z.ZodError) {
         console.error(
            "Validation error in follows route:",
            error,
         );
         return res.status(400).json({
            error:
               error.errors?.[0]?.message ||
               "Invalid request",
         });
      }

      return handleServerError(
         res,
         "Error fetching follows",
         error,
      );
   }
});

// ===============================
// POST /api/users/follows/sync
// Sync follows: add new follows and remove unfollows
// ===============================
router.post("/follows/sync", async (req, res) => {
   try {
      const { follower_id, added, removed } =
         syncFollowsSchema.parse(req.body);

      // Add new follows
      if (added.length > 0) {
         const toInsert = added.map((following_id) => ({
            follower_id,
            following_id,
         }));

         const { error: insertError } = await supabase
            .from("follows")
            .insert(toInsert);

         if (insertError) {
            throw insertError;
         }
      }

      // Remove unfollowed users
      if (removed.length > 0) {
         const { error: deleteError } = await supabase
            .from("follows")
            .delete()
            .eq("follower_id", follower_id)
            .in("following_id", removed);

         if (deleteError) {
            throw deleteError;
         }
      }

      return res.status(200).json({
         message: "Follows synced successfully",
      });
   } catch (error) {
      if (error instanceof z.ZodError) {
         console.error(
            "Validation error syncing follows:",
            error,
         );
         return res.status(400).json({
            error:
               error.errors?.[0]?.message ||
               "Invalid request",
         });
      }

      return handleServerError(
         res,
         "Error syncing follows",
         error,
      );
   }
});

export default router;
