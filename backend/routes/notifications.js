import express from "express";
import { supabase } from "../config/supabaseClient.js";

const router = express.Router();

// Get all notifications for a user
router.get("/:userId", async (req, res) => {
   const { userId } = req.params;
   try {
      const { data, error } = await supabase
         .from("notifications")
         .select("*")
         .eq("user_id", userId)
         .order("created_at", { ascending: false });

      if (error) {
         throw error;
      }

      res.status(200).json(data);
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
});

// Mark all notifications as read for a user
router.patch("/:userId/read-all", async (req, res) => {
   const { userId } = req.params;
   try {
      const { error } = await supabase
         .from("notifications")
         .update({ is_read: true })
         .eq("user_id", userId);

      if (error) {
         throw error;
      }

      res.status(200).json({
         message: "All notifications marked as read",
      });
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
});

// Delete all notifications for a user
router.delete("/:userId/delete-all", async (req, res) => {
   const { userId } = req.params;
   try {
      const { error } = await supabase
         .from("notifications")
         .delete()
         .eq("user_id", userId);

      if (error) {
         throw error;
      }

      res.status(200).json({
         message: "All notifications deleted",
      });
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
});

// Mark a notification as read
router.patch("/:id/read", async (req, res) => {
   const { id } = req.params;
   try {
      const { data, error } = await supabase
         .from("notifications")
         .update({ is_read: true })
         .eq("id", id)
         .select();

      if (error) {
         throw error;
      }

      res.status(200).json(data[0]);
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
});

// Delete a notification
router.delete("/:id", async (req, res) => {
   const { id } = req.params;
   try {
      const { error } = await supabase
         .from("notifications")
         .delete()
         .eq("id", id);

      if (error) {
         throw error;
      }

      res.status(200).json({
         message: "Notification deleted",
      });
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
});

export default router;
