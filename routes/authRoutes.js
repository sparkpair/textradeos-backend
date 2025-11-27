// routes/auth.js
import express from "express";
import User from "../models/User.js";
import { protect } from "../middlewares/authMiddleware.js"; // verifies JWT token
import Subscription from "../models/Subscription.js";

const router = express.Router();

// GET /auth/status
router.get("/status", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("businessId");

    if (!user) return res.status(401).json({ message: "Invalid token" });

    if (user.role !== "developer") {
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

      if (now < new Date(subscription.startDate)) {
        return res.status(403).json({
          message: `Subscription not started yet. Starts on ${subscription.startDate.toDateString()}.`
        });
      }

      if (now > new Date(subscription.endDate)) {
        return res.status(403).json({ message: "Subscription expired." });
      }
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
