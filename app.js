import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";
import userRoutes from "./routes/userRoutes.js";
import connectDB from "./config/db.js";
import businessRoutes from "./routes/businessRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import articleRoutes from "./routes/articleRoutes.js";
import { protect } from "./middlewares/authMiddleware.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection failed on request:", err.message);
    res.status(500).json({ message: "Database connection failed" });
  }
});

// Routes
app.use("/api/users", protect, userRoutes);
app.use("/api/businesses", protect, businessRoutes);
app.use("/api/customers", protect, customerRoutes);
app.use("/api/articles", protect, articleRoutes);

// Middlewares
app.use(notFound);
app.use(errorHandler);

export default app;
