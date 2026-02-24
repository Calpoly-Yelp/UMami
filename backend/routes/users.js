import express from "express";
import { supabase } from "../config/supabaseClient.js";
import { User } from "../models/userModel.js";

const router = express.Router();

// Get user by ID
router.get("/:id", async (req, res) => {
   const { id } = req.params;
   try {
      const { data } = await supabase
         .from("users")
         .select("*")
         .eq("id", id)
         .single();

      const validatedData = User.parse(data);

      res.status(200).json(validatedData);
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
});

export default router;
