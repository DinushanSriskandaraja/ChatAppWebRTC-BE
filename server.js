const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config(); // Load environment variables

// Initialize the app
const app = express();
const server = http.createServer(app);

// Set up Socket.IO with CORS configuration
const io = socketIo(server, {
  cors: {
    origin: "*", // Frontend address
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

// Serve static files (optional: for frontend assets)
app.use(express.static("public"));

// Keep track of connected users
let users = {};

// When a user connects
// When a user connects
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // When a user joins the chat (send their username)
  socket.on("join", (userName) => {
    // Add user to online users list
    users[socket.id] = userName;
    console.log(`${userName} joined the chat.`);

    // Broadcast the updated online users list to everyone
    io.emit(
      "onlineUsers",
      Object.entries(users).map(([id, name]) => ({ id, name }))
    );
  });

  // Handle signaling data (offer, answer, ice candidate)
  socket.on("signal", (data) => {
    const { userId, signalType, signalData } = data;
    console.log(`Signaling to user: ${userId} with type: ${signalType}`);

    // Send the signal to the target user
    io.to(userId).emit("signal", {
      userId: socket.id, // ID of the user sending the signal
      signalType,
      signalData,
    });
  });

  // When a user disconnects
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    const userName = users[socket.id];
    delete users[socket.id];
    // Broadcast updated users list
    io.emit(
      "onlineUsers",
      Object.entries(users).map(([id, name]) => ({ id, name }))
    );
    io.emit("userLeft", userName); // Inform others that a user has left
  });
});

// Set up the server to listen on a port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
