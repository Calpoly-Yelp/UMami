import express from "express";
import { supabase } from "../config/supabaseClient.js";
import {
   Restaurant,
   Bookmark,
} from "../models/restaurantModel.js";
import { z } from "zod";

const router = express.Router();

// Get all restaurants
router.get("/", async (req, res) => {
   try {
      const { data } = await supabase
         .from("restaurants")
         .select("*");

      const validatedData = z.array(Restaurant).parse(data);

      res.status(200).json(validatedData);
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
});

// Get restaurant by id
router.get("/:id", async (req, res) => {
   try {
      const { id } = req.params;
      const { data } = await supabase
         .from("restaurants")
         .select("*")
         .eq("id", id)
         .single();

      // If no data is returned, the restaurant was not found
      if (!data) {
         return res
            .status(404)
            .json({ error: "Restaurant not found" });
      }
      const validatedData = Restaurant.parse(data);

      res.status(200).json(validatedData);
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
});

// Get bookmarks for a specific user
router.get("/bookmarks/:userId", async (req, res) => {
   const { userId } = req.params;
   try {
      // Step 1: Fetch all bookmarked restaurant ids for a user
      const { data: bookmarks } = await supabase
         .from("bookmarks")
         .select("restaurant_id")
         .eq("user_id", userId);

      const restaurantIds = bookmarks.map(
         (b) => b.restaurant_id,
      );

      // Step 2: Use those restaurant ids to fetch the restaurant object
      const { data: restaurants } = await supabase
         .from("restaurants")
         .select("*")
         .in("id", restaurantIds);

      res.status(200).json(restaurants);
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
});

// Get all bookmarked restaurants
router.get("/bookmarks", async (req, res) => {
   try {
      const { data } = await supabase
         .from("bookmarks")
         .select("*");

      const validatedData = z.array(Bookmark).parse(data);

      res.status(200).json(validatedData);
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
});

// Add a restaurant to bookmarks
router.post("/bookmarks", async (req, res) => {
   const { user_id, restaurant_id } = req.body;
   try {
      const { data, error } = await supabase
         .from("bookmarks")
         .insert({ user_id, restaurant_id });

      if (error) {
         return res.status(500).json(error);
      }

      res.status(201).json(data);
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
});

// Sync bookmarks
router.post("/bookmarks/sync", async (req, res) => {
   const { user_id, added, removed } = req.body;
   try {
      // Handle removals
      if (removed && removed.length > 0) {
         await supabase
            .from("bookmarks")
            .delete()
            .eq("user_id", user_id)
            .in("restaurant_id", removed);
      }

      // Handle additions
      if (added && added.length > 0) {
         const rowsToAdd = added.map((rid) => ({
            user_id,
            restaurant_id: rid,
         }));
         await supabase.from("bookmarks").insert(rowsToAdd);
      }

      res.status(200).json({ message: "Sync successful" });
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
});

export default router;
