import express from "express";
import { supabase } from "../config/supabaseClient.js";
import { Review } from "../models/reviewModel.js";
import { z } from "zod";

const router = express.Router();

// ─────────────────────────────────────────────
// GET /api/reviews
// Fetches all reviews, with optional filters:
//   ?user_id=...        → reviews by a specific user
//   ?restaurant_id=...  → reviews for a specific restaurant
//   ?current_user_id=.. → also marks which reviews the
//                         current user has voted helpful
// ─────────────────────────────────────────────
router.get("/", async (req, res) => {
   try {
      const { user_id, restaurant_id, current_user_id } =
         req.query;

      // Start query — also join the users table to get
      // name, avatar, and verified status for each review
      let query = supabase
         .from("reviews")
         .select(
            "*, users!reviews_user_id_fkey(name, avatar_url, is_verified)",
         );

      // Filter by user if user_id query param was provided
      if (user_id) {
         query = query.eq("user_id", user_id);
      }

      // Filter by restaurant if restaurant_id was provided
      if (restaurant_id) {
         query = query.eq("restaurant_id", restaurant_id);
      }

      const { data, error } = await query;

      if (error) {
         throw error;
      }

      // If current_user_id was provided, check which reviews
      // this user has already voted as helpful, and attach
      // has_voted_helpful: true/false to each review object
      if (current_user_id && data.length > 0) {
         const reviewIds = data.map((r) => r.id);

         const { data: votesData, error: votesError } =
            await supabase
               .from("review_helpful_votes")
               .select("review_id")
               .eq("user_id", current_user_id)
               .in("review_id", reviewIds);

         if (!votesError && votesData) {
            const votedReviewIds = new Set(
               votesData.map((v) => v.review_id),
            );

            // Mutate each review to add the has_voted_helpful flag
            data.forEach((r) => {
               r.has_voted_helpful = votedReviewIds.has(
                  r.id,
               );
            });
         }
      }

      // Validate response shape against Zod schema before sending
      const validatedData = z.array(Review).parse(data);

      res.status(200).json(validatedData);
   } catch (error) {
      res.status(500).json({
         error: error?.message || "Internal Server Error",
      });
   }
});

// ─────────────────────────────────────────────
// POST /api/reviews
// Creates a new review and saves it to the database.
// Body: { user_id, restaurant_id, rating, comment, tags, photo_urls }
// photo_urls is an array of Supabase Storage public URLs
// uploaded before this call is made (via /api/uploads/review-photo)
// ─────────────────────────────────────────────
router.post("/", async (req, res) => {
   try {
      const {
         user_id,
         restaurant_id,
         rating,
         comment,
         tags,
         photo_urls,
      } = req.body;

      // Basic validation — user and rating are required
      if (!user_id || !rating) {
         return res.status(400).json({
            error: "user_id and rating are required",
         });
      }

      // Insert the new review into the reviews table
      const { data, error } = await supabase
         .from("reviews")
         .insert([
            {
               user_id,
               restaurant_id, // can be null if not wired up yet
               rating,
               comment,
               tags,
               photo_urls, // array of public Supabase Storage URLs
            },
         ])
         .select()
         .single();

      if (error) {
         throw error;
      }

      // Validate the returned row against the Zod Review schema
      const validatedData = Review.parse(data);

      // Return 201 Created with the new review
      return res.status(201).json(validatedData);
   } catch (err) {
      return res.status(500).json({
         error: err?.message || "Internal Server Error",
      });
   }
});

// ─────────────────────────────────────────────
// POST /api/reviews/:id/helpful
// Toggles the helpful vote for a specific review.
// If the user has already voted → removes the vote
// If the user hasn't voted yet → adds the vote
// The DB trigger automatically updates helpful_count on the review
// Body: { user_id }
// ─────────────────────────────────────────────
router.post("/:id/helpful", async (req, res) => {
   try {
      const { id } = req.params;
      const { user_id } = req.body;

      if (!user_id) {
         return res
            .status(400)
            .json({ error: "user_id is required" });
      }

      // Check if this user has already voted on this review
      const { data: existingVote, error: checkError } =
         await supabase
            .from("review_helpful_votes")
            .select("*")
            .eq("review_id", id)
            .eq("user_id", user_id)
            .maybeSingle();

      if (checkError) {
         throw checkError;
      }

      // Track whether user ends up having voted after this toggle
      let hasVoted = true;

      if (existingVote) {
         // User already voted — remove the vote (toggle off)
         const { error: deleteError } = await supabase
            .from("review_helpful_votes")
            .delete()
            .eq("review_id", id)
            .eq("user_id", user_id);

         if (deleteError) {
            throw deleteError;
         }

         hasVoted = false;
      } else {
         // User hasn't voted yet — add the vote (toggle on)
         const { error: insertError } = await supabase
            .from("review_helpful_votes")
            .insert([{ review_id: id, user_id }]);

         if (insertError) {
            throw insertError;
         }
      }

      // Fetch the updated review after the vote change
      // The DB trigger handles recalculating helpful_count automatically
      const { data: updatedReview, error: fetchError } =
         await supabase
            .from("reviews")
            .select()
            .eq("id", id)
            .single();

      if (fetchError) {
         throw fetchError;
      }

      // Return the updated review with the current vote state
      res.status(200).json({
         ...updatedReview,
         has_voted_helpful: hasVoted,
      });
   } catch (error) {
      res.status(500).json({
         error: error?.message || "Internal Server Error",
      });
   }
});

export default router;
