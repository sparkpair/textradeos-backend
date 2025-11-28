import express from "express";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// GET /auth/status
router.get("/status", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("businessId");

    if (!user) return res.status(401).json({ message: "Invalid token" });

    // Developer → NO SUBSCRIPTION CHECK
    if (user.role === "developer") {
      return res.json({ user });
    }

    const business = user.businessId;

    if (!business || !business.isActive) {
      return res.status(403).json({ message: "Business is inactive" });
    }

    const subscription = await Subscription.findOne({
      businessId: business._id
    }).sort({ endDate: -1 });

    if (!subscription) {
      return res.status(403).json({ message: "No subscription found." });
    }

    const now = new Date();
    const start = new Date(subscription.startDate);
    const end = new Date(subscription.endDate);

    if (now < start) {
      return res.status(403).json({
        message: `Subscription starts on ${start.toDateString()}.`
      });
    }

    if (now > end) {
      return res.status(403).json({
        message: `Subscription expired on ${end.toDateString()}.`
      });
    }

    res.json({ user });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
