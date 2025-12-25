import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Session from "../models/Session.js";
import Subscription from "../models/Subscription.js";

const generateToken = (id, sessionId) => {
  return jwt.sign({ id, sessionId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username })
      .populate("businessId", "name isActive");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Active session and User status checks
    const activeSession = await Session.findOne({ userId: user._id, isActive: true });
    if (activeSession) return res.status(403).json({ message: "User already logged in on another device." });
    if (!user.isActive) return res.status(403).json({ message: "User is inactive." });

    let isReadOnly = false;

    // Subscription Logic
    if (user.role !== "developer") {
      const business = user.businessId;
      if (!business || !business.isActive) return res.status(403).json({ message: "Business is inactive." });

      const subscription = await Subscription.findOne({ businessId: business._id }).sort({ endDate: -1 });

      if (!subscription) {
        isReadOnly = true; 
      } else {
        const now = new Date();
        const end = new Date(subscription.endDate);
        if (now > end) {
          isReadOnly = true; // Expired → Allow login, but Read Only
        }
      }
    }

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
      isReadOnly, // Sending this to frontend
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
      return res.status(400).json({ message: "Session ID required" });
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
    res.status(500).json({ message: "Server error during logout" });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user ? res.json(user) : res.status(404).json({ message: "User not found" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
