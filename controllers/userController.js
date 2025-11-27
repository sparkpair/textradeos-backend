import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Session from "../models/Session.js";
import Subscription from "../models/Subscription.js";

const generateToken = (id, sessionId) => {
  return jwt.sign({ id, sessionId }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username })
      .populate("businessId", "name isActive");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // 🔹 CHECK ACTIVE SESSION
    const activeSession = await Session.findOne({ userId: user._id, isActive: true });
    if (activeSession) {
      return res.status(403).json({ message: "User already logged in from another device." });
    }

    // 🔹 USER INACTIVE?
    if (!user.isActive) {
      return res.status(403).json({ message: "User is inactive." });
    }

    // 🔹 Developer bypasses business & subscription checks
    if (user.role !== "developer") {
      const business = user.businessId;

      // ❌ BUSINESS INACTIVE
      if (!business || !business.isActive) {
        return res.status(403).json({ message: "Business is inactive." });
      }

      // 🔍 GET LATEST SUBSCRIPTION
      const subscription = await Subscription.findOne({
        businessId: business._id
      }).sort({ endDate: -1 });

      // ❌ NO SUBSCRIPTION
      if (!subscription) {
        return res.status(403).json({ message: "No subscription found." });
      }

      const now = new Date();

      // ❌ START DATE NOT REACHED
      if (now < new Date(subscription.startDate)) {
        return res.status(403).json({
          message: `Your subscription starts on ${subscription.startDate.toDateString()}.`
        });
      }

      // ❌ ENDED
      if (now > new Date(subscription.endDate)) {
        return res.status(403).json({ message: "Subscription expired." });
      }
    }

    // 🔹 CREATE NEW SESSION
    const session = await Session.create({
      userId: user._id,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, session._id);

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
      businessId: user.businessId?._id || null,
      businessName: user.businessId?.name || null,
      token,
      sessionId: session._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (!session.isActive) {
      return res.status(200).json({ message: "Already logged out" });
    }
    
    session.logoutTime = new Date();
    session.isActive = false;
    session.duration = Math.floor(
      (session.logoutTime - session.loginTime) / (1000 * 60)
    );

    await session.save();

    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error.message);
    res.status(500).json({ message: "Server error during logout" });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
