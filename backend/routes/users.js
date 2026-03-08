import express from "express";
import { supabase } from "../config/supabaseClient.js";
import { User } from "../models/userModel.js";

const router = express.Router();

// Get all users
router.get("/", async (req, res) => {
   try {
      const { data, error } = await supabase
         .from("users")
         .select("*")
         .limit(50);
      if (error) {
         throw error;
      }
      console.log("Fetched users:", data);
      res.status(200).json(data);
   } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: error.message });
   }
});

// Get user by ID
router.get("/:id", async (req, res) => {
   const { id } = req.params;
   try {
      const { data, error } = await supabase
         .from("users")
         .select("*")
         .eq("id", id)
         .single();

      if (error) {
         if (error.code === "PGRST116") {
            return res
               .status(404)
               .json({ error: "User not found" });
         }
         throw error;
      }

      const validatedData = User.parse(data);

      res.status(200).json(validatedData);
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
});

// Takes in a users id, and returns all of there followings
// user structures
router.get("/:id/follows", async (req, res) => {
   const { id } = req.params;
   try {
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

      const followingIds = data.map(
         (follow) => follow.following_id,
      );

      const { data: followingUsers, error: usersError } =
         await supabase
            .from("users")
            .select("*")
            .in("id", followingIds);

      if (usersError) {
         throw usersError;
      }

      res.status(200).json(followingUsers);
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
});

// Sync follows (add/remove)
router.post("/follows/sync", async (req, res) => {
   const { follower_id, added, removed } = req.body;
   try {
      if (added && added.length > 0) {
         const toInsert = added.map((following_id) => ({
            follower_id,
            following_id,
         }));
         await supabase.from("follows").insert(toInsert);
      }

      if (removed && removed.length > 0) {
         await supabase
            .from("follows")
            .delete()
            .eq("follower_id", follower_id)
            .in("following_id", removed);
      }

      res.status(200).json({
         message: "Follows synced successfully",
      });
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
});

export default router;
