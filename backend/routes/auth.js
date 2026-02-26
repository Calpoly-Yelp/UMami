import { Router } from "express";
import bcrypt from "bcrypt";
import { supabase } from "../config/supabaseClient.js";

const router = Router();

function getClientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length > 0) return xf.split(",")[0].trim();
  return req.socket?.remoteAddress ?? null;
}

router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ error: "Missing fields" });
  if (password.length < 8) return res.status(400).json({ error: "Password must be 8+ characters" });

  const password_hash = await bcrypt.hash(password, 12);

  const { data: user, error } = await supabase
    .from("users")
    .insert([{ email, password_hash }])
    .select("id,email,created_at")
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.cookie("uid", user.id, { httpOnly: true, sameSite: "lax", secure: false });
  return res.json({ user });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ error: "Missing fields" });

  const ip = getClientIp(req);
  const ua = req.headers["user-agent"] ?? null;

  const { data: user, error } = await supabase
    .from("users")
    .select("id,email,password_hash")
    .eq("email", email)
    .maybeSingle();

  if (error) return res.status(400).json({ error: error.message });

  if (!user) {
    await supabase.from("login_events").insert([
      { user_id: null, email, success: false, ip, user_agent: ua },
    ]);
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.password_hash);

  await supabase.from("login_events").insert([
    { user_id: user.id, email: user.email, success: ok, ip, user_agent: ua },
  ]);

  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  res.cookie("uid", user.id, { httpOnly: true, sameSite: "lax", secure: false });
  return res.json({ user: { id: user.id, email: user.email } });
});

router.post("/logout", (req, res) => {
  res.clearCookie("uid");
  return res.json({ ok: true });
});

export default router;
