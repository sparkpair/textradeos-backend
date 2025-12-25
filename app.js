// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";

// import connectDB from "./config/db.js";

// import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";

// import authRoutes from "./routes/authRoutes.js";
// import userRoutes from "./routes/userRoutes.js";
// import businessRoutes from "./routes/businessRoutes.js";
// import customerRoutes from "./routes/customerRoutes.js";
// import articleRoutes from "./routes/articleRoutes.js";
// import invoiceRoutes from "./routes/invoiceRoutes.js";
// import paymentRoutes from "./routes/paymentRoutes.js";
// import subscriptionRoutes from "./routes/subscriptionRoutes.js";
// import dashboardRoutes from "./routes/dashboardRoutes.js";
// import exportRoutes from "./routes/exportRoutes.js";

// import { protect } from "./middlewares/authMiddleware.js";

// dotenv.config();

// const app = express();

// app.use(cors());
// app.use(express.json());

// app.use(async (req, res, next) => {
//   try {
//     await connectDB();
//     next();
//   } catch (err) {
//     console.error("Database connection failed on request:", err.message);
//     res.status(500).json({ message: "Database connection failed" });
//   }
// });

// // Routes
// app.use("/api/auth", protect, authRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/businesses", protect, businessRoutes);
// app.use("/api/customers", protect, customerRoutes);
// app.use("/api/articles", protect, articleRoutes);
// app.use("/api/invoices", protect, invoiceRoutes);
// app.use("/api/payments", protect, paymentRoutes);
// app.use("/api/subscriptions", protect, subscriptionRoutes);
// app.use("/api/dashboard", protect, dashboardRoutes);
// app.use("/api/export-data", protect, exportRoutes);

// // Middlewares
// app.use(notFound);
// app.use(errorHandler);

// export default app;



// app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import businessRoutes from "./routes/businessRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import articleRoutes from "./routes/articleRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import exportRoutes from "./routes/exportRoutes.js";

import { protect } from "./middlewares/authMiddleware.js";

dotenv.config();

const app = express();

/* -------------------- Middleware -------------------- */

app.use(cors());
app.use(express.json());

/* -------------------- DB Connection (Serverless Safe) -------------------- */

let isConnected = false;

app.use(async (req, res, next) => {
  try {
    if (!isConnected) {
      await connectDB();
      isConnected = true;
      console.log("✅ Database connected");
    }
    next();
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    res.status(500).json({ message: "Database connection failed" });
  }
});

/* -------------------- Routes -------------------- */

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use("/api/businesses", protect, businessRoutes);
app.use("/api/customers", protect, customerRoutes);
app.use("/api/articles", protect, articleRoutes);
app.use("/api/invoices", protect, invoiceRoutes);
app.use("/api/payments", protect, paymentRoutes);
app.use("/api/subscriptions", protect, subscriptionRoutes);
app.use("/api/dashboard", protect, dashboardRoutes);
app.use("/api/export-data", protect, exportRoutes);

/* -------------------- Health Check -------------------- */

app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "TexTradeOS Backend running on Vercel 🚀",
  });
});

/* -------------------- Error Handling -------------------- */

app.use(notFound);
app.use(errorHandler);

export default app;
