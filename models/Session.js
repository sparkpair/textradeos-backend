import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    loginTime: { type: Date, default: Date.now },
    logoutTime: { type: Date, default: null },
    duration: { type: Number, default: 0 }, // minutes
    userAgent: String,
    ipAddress: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Session", sessionSchema);
