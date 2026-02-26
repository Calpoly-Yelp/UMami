import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes/index.js"; // add this
import { supabase } from "./config/supabaseClient.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

<<<<<<< HEAD
/* Mount router */
app.use("/api", routes);

/* Keep temporary debug route (optional) */
=======
>>>>>>> prarthana
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
