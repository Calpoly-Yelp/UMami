import "dotenv/config";
import express from "express";
import cors from "cors";
import reviewsRouter from "./routes/reviews.js";
import usersRouter from "./routes/users.js";
import restaurantsRouter from "./routes/restaurants.js";
import { supabase } from "./config/supabaseClient.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "http://localhost:5173" }));
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
app.use("/api/restaurants", restaurantsRouter);

/* Keep temporary debug route (optional) */
app.get("/test-supabase", async (req, res) => {
   const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .limit(1);

   if (error) {
      return res.status(500).json({ error: error.message });
   }

   return res.json({ status: "Connected!", data });
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
