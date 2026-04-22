import express from "express";
import { supabase } from "../config/supabaseClient.js";
import { Review } from "../models/reviewModel.js";
import { z } from "zod";

const router = express.Router();

// Get all reviews
router.get("/", async (req, res) => {
   try {
      const { user_id, restaurant_id, current_user_id } =
         req.query;
      let query = supabase
         .from("reviews")
         .select(
            "*, users!reviews_user_id_fkey(name, avatar_url, is_verified)",
         );

      // check if a user id was given, then grab reviews by user id
      if (user_id) {
         query = query.eq("user_id", user_id);
      }

      // check if a restaurant id was given, then grab reviews by restaurant id
      if (restaurant_id) {
         query = query.eq("restaurant_id", restaurant_id);
      }

      const { data, error } = await query;

      if (error) {
         throw error;
      }

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
            data.forEach((r) => {
               r.has_voted_helpful = votedReviewIds.has(
                  r.id,
               );
            });
         }
      }

      const validatedData = z.array(Review).parse(data);

      res.status(200).json(validatedData);
   } catch (error) {
      res.status(500).json({
         error: error?.message || "Internal Server Error",
      });
   }
});

// Toggle the helpful vote for a specific review
router.post("/:id/helpful", async (req, res) => {
   try {
      const { id } = req.params;
      const { user_id } = req.body;

      if (!user_id) {
         return res
            .status(400)
            .json({ error: "user_id is required" });
      }

      // Check if vote exists
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

      let hasVoted = true;

      if (existingVote) {
         // User has voted, remove vote
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
         // User hasn't voted, add vote
         const { error: insertError } = await supabase
            .from("review_helpful_votes")
            .insert([{ review_id: id, user_id }]);
         if (insertError) {
            throw insertError;
         }
      }

      // Fetch the updated review (the DB trigger handles updating helpful_count)
      const { data: updatedReview, error: fetchError } =
         await supabase
            .from("reviews")
            .select()
            .eq("id", id)
            .single();

      if (fetchError) {
         throw fetchError;
      }

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
