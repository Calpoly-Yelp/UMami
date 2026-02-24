import express from "express";
import { supabase } from "./config/supabaseClient.js";
import dotenv from "dotenv";
import reviewsRouter from "./routes/reviews.js";
import usersRouter from "./routes/users.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Enable CORS to allow requests from the frontend
app.use((req, res, next) => {
   res.header("Access-Control-Allow-Origin", "*");
   res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept",
   );
   next();
});

// Routes
app.use("/api/reviews", reviewsRouter);
app.use("/api/users", usersRouter);

// Test Supabase connection
app.get("/test-supabase", async (req, res) => {
   const { data, error } = await supabase
      .from("Restaurant")
      .select("*")
      .limit(1);
   if (error) {
      return res.status(500).json(error);
   }
   res.json({ status: "Connected!", data });
});

app.listen(PORT, () => {
   console.log(
      `Server is alive on http://localhost:${PORT}`,
   );
   console.log(
      `Try visiting http://localhost:${PORT}/test-supabase`,
   );
});

export default app;
