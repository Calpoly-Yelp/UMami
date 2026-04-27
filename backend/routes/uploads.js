import express from "express";
import multer from "multer";
import { supabase } from "../config/supabaseClient.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const BUCKET = "review-photos";

// POST /api/uploads/review-photo
router.post(
   "/review-photo",
   upload.single("file"),
   async (req, res) => {
      try {
         if (!req.file) {
            return res
               .status(400)
               .json({ error: "No file provided" });
         }

         const ext = req.file.originalname.split(".").pop();
         const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

         const { error: uploadError } =
            await supabase.storage
               .from(BUCKET)
               .upload(fileName, req.file.buffer, {
                  contentType: req.file.mimetype,
                  upsert: false,
               });

         if (uploadError) {
            throw uploadError;
         }

         const { data } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(fileName);

         return res
            .status(201)
            .json({ url: data.publicUrl });
      } catch (err) {
         console.error("Upload error:", err);
         return res
            .status(500)
            .json({ error: err.message });
      }
   },
);

export default router;
