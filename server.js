import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect DB (if not serverless)
if (process.env.VERCEL !== "true") {
  connectDB();
}

// Create HTTP server and bind Socket.IO
export const server = http.createServer(app);
export const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// 🔹 Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`⚡ New client connected: ${socket.id}`);

  // Example: handle a notification request
  socket.on("send-notification", (data) => {
    console.log("📩 Notification received:", data);

    // Broadcast to all clients (or specific room/user)
    io.emit("new-notification", data);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Listen on HTTP server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
