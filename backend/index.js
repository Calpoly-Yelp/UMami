import express from "express";
import { supabase } from "./config/supabaseClient.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Debug route to test Supabase connection
app.get("/debug-supabase", async (req, res) => {
  const { data, error } = await supabase.from("Restaurant").select("*").limit(1);
  if (error) return res.status(500).json(error);
  res.json({ status: "Connected!", data });
});

app.listen(PORT, () => {
  console.log(`Server is alive on http://localhost:${PORT}`);
  console.log(`Try visiting http://localhost:${PORT}/debug-supabase`);
});
