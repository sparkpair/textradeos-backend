import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // 🔹 Create default developer user if not exists
    const existingDev = await User.findOne({ role: "developer" });

    if (!existingDev) {
      await User.create({
        name: "Developer",
        username: "dev",
        password: "dev",
        role: "developer",
      });
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
