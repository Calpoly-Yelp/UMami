import "dotenv/config";
import express from "express";
import cors from "cors";
import reviewsRouter from "./routes/reviews.js";
import usersRouter from "./routes/users.js";
import restaurantsRouter from "./routes/restaurants.js";
import notificationsRouter from "./routes/notifications.js";
import { supabase } from "./config/supabaseClient.js";
import uploadsRouter from "./routes/uploads.js";
import "./utils/restaurantScraper.js";
import { scheduleCurrentMenuScraper } from "./utils/scrapeCurrentMenus.js";

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration — allows requests from the frontend and local dev
// Must use specific origins (not "*") when credentials are involved
app.use(
   cors({
      origin: [
         "https://thankful-hill-0f3846d10.7.azurestaticapps.net", // Azure production frontend
         "http://localhost:5173", // Local Vite dev server
         "http://localhost:5174",
      ],
      credentials: true, // Allow cookies and auth headers to be sent
   }),
);

// Parse incoming JSON request bodies
app.use(express.json());

// Routes
app.use("/api/reviews", reviewsRouter);
app.use("/api/users", usersRouter);
app.use("/api/restaurants", restaurantsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/uploads", uploadsRouter);

// Temporary debug route to verify Supabase connection is working
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

// Root route
app.get("/", (req, res) => {
   res.json({ status: "UMami API is running!" });
});

// Only start the server if we're not in a test environment
if (process.env.NODE_ENV !== "test") {
   scheduleCurrentMenuScraper();

   app.listen(PORT, () => {
      console.log(
         `Server is alive on http://localhost:${PORT}`,
      );
      console.log(
         `Try visiting http://localhost:${PORT}/test-supabase`,
      );
   });
}

export default app;
