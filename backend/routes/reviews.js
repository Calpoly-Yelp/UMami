import express from "express";
import { supabase } from "../config/supabaseClient.js";
import { Review } from "../models/reviewModel.js";
import { z } from "zod";

const router = express.Router();

// Get all reviews
router.get("/", async (req, res) => {
   try {
      const { user_id, restaurant_id } = req.query;
      let query = supabase
         .from("reviews")
         .select("*, users(name, avatar_url, is_verified)");

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

      const validatedData = z.array(Review).parse(data);

      res.status(200).json(validatedData);
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
});

export default router;
