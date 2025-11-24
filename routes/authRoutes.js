// routes/auth.js
import express from "express";
import User from "../models/User.js";
import Business from "../models/Business.js";
import { protect } from "../middlewares/authMiddleware.js"; // verifies JWT token

const router = express.Router();

// GET /auth/status
router.get("/status", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("businessId");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check user status
    if (!user.isActive) {
      return res.status(403).json({ message: "User is inactive" });
    }

    // If role is not developer, check business status
    if (user.role !== "developer") {
      const business = user.businessId;
      if (!business || !business.isActive) {
        return res.status(403).json({ message: "Business is inactive" });
      }
    }

    res.json({
      message: "User active",
      user,
      business: user.businessId || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
