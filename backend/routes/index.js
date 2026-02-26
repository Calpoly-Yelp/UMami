import { Router } from "express";
import { supabase } from "../config/supabaseClient.js";

const router = Router();

router.get("/health", (req, res) => {
   res.json({ ok: true });
});

router.get("/restaurants", async (req, res) => {
   const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .limit(10);

   if (error) {
      return res.status(500).json({ error: error.message });
   }
   return res.json(data);
});

export default router;
