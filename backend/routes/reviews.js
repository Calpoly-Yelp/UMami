import express from "express";
import { supabase } from "../config/supabaseClient.js";
import { Review } from "../models/reviewModel.js";
import { z } from "zod";

const router = express.Router();

// Get all reviews
router.get("/", async (req, res) => {
   try {
      const { data } = await supabase
         .from("reviews")
         .select("*");

      const validatedData = z.array(Review).parse(data);

      res.status(200).json(validatedData);
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
});

export default router;
