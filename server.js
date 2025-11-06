import dotenv from "dotenv";
import connectDB from "./config/db.js";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// For non-serverless (local, EC2, etc.)
if (process.env.VERCEL !== "true") {
  connectDB();
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
