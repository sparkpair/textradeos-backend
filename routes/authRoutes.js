import express from "express";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import { protect } from "../middlewares/authMiddleware.js";
const router = express.Router();

// GET /auth/status
router.get("/status", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("businessId");
    if (!user) return res.status(401).json({ message: "Invalid token" });

    let isReadOnly = false;
    if (user.role !== "developer") {
      const subscription = await Subscription.findOne({ businessId: user.businessId?._id }).sort({ endDate: -1 });
      const now = new Date();
      if (!subscription || now > new Date(subscription.endDate)) {
        isReadOnly = true;
      }
    }

    // Return user with read-only status
    const userData = user.toObject();
    userData.isReadOnly = isReadOnly;

    res.json({ user: userData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
