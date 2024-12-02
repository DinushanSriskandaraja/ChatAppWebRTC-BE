const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

// Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow CORS for development; adjust for production as needed
  },
});

const onlineUsers = new Map(); // Store online users with socket ID and user details

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Listen for 'join' event to add a user to the online list
  socket.on("join", (userName) => {
    // Store user object with id and name
    onlineUsers.set(socket.id, { id: socket.id, name: userName });

    // Broadcast updated user list
    io.emit("updateUserList", Array.from(onlineUsers.values()));
    console.log(`User joined: ${userName}`);
  });

  // Listen for signaling messages (like SDP or ICE candidates)
  socket.on("signal", (data) => {
    const { targetId, signal } = data;

    if (onlineUsers.has(targetId)) {
      // Log the details of the message being sent
      console.log(`Signal message from ${socket.id} to ${targetId}:`, signal);

      // Send the signal to the target user
      io.to(targetId).emit("signal", {
        senderId: socket.id,
        signal,
      });
    } else {
      console.log(`User with ID ${targetId} not online. Cannot send signal.`);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      console.log(`User disconnected: ${user.name}`);
      onlineUsers.delete(socket.id);
      io.emit("updateUserList", Array.from(onlineUsers.values()));
    }
  });
});

// Endpoint to get the current list of online users
app.get("/online-users", (req, res) => {
  // Return the list of online users as an array of objects
  res.json(Array.from(onlineUsers.values()));
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
