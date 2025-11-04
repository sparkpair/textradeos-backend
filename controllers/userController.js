import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Session from "../models/Session.js";

const generateToken = (id, sessionId) => {
  return jwt.sign({ id, sessionId }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // ❌ Already logged in?
    const activeSession = await Session.findOne({ userId: user._id, isActive: true });
    if (activeSession) {
      return res
        .status(403)
        .json({ message: "User already logged in from another device." });
    }

    // ✅ Create new session
    const session = await Session.create({
      userId: user._id,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    // Update user info
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, session._id);

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
      token,
      sessionId: session._id, // 👈 send sessionId to frontend
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

// @desc Get Profile
// @route GET /api/users/profile
// @access Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
