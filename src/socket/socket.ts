import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import type { Socket } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://medicare-client.onrender.com"],
    methods: ["GET", "POST"],
  },
});

const users = new Map();
const activeUsers = new Set();
const chatConnections = new Map();

function broadcastUserStatus(userId: string, isActive: boolean) {
  io.emit("userActiveStatus", {
    userId,
    isActive,
  });
}

function sendAllActiveStatusToUser(socket: Socket) {
  activeUsers.forEach((activeUserId) => {
    socket.emit("userActiveStatus", {
      userId: activeUserId,
      isActive: true,
    });
  });
}

io.on("connection", (socket) => {
  console.log(`A user connected: ${socket.id}`);

  socket.on("join", (userId) => {
    if (!userId) return;

    // socket.userId = userId;

    if (!users.has(userId)) {
      users.set(userId, new Set());
    }

    users.get(userId).add(socket.id);

    console.log(`user ${userId} joined with socket id ${socket.id}`);

    activeUsers.add(userId);

    broadcastUserStatus(userId, true);

    sendAllActiveStatusToUser(socket);
  });

  socket.on("joinChat", (chatId: string) => {
    socket.join(chatId);
    console.log(`user with socket id ${socket.id} joined chat room ${chatId}`);
  });

  socket.on("setActiveUsers", ({ userId }) => {
    if (!userId) {
      return;
    }

    activeUsers.add(userId);
    broadcastUserStatus(userId, true);
  });

  socket.on("typing", (data) => {
    const { senderId, receiverId, chatId } = data;

    const receiverSocket = users.get(receiverId);
    if (receiverSocket) {
      receiverSocket.forEach((socketId: string) => {
        io.to(socketId).emit("userTyping", {
          senderId,
          isTyping: true,
          chatId,
        });
      });
    }
  });

  socket.on("stopTyping", (data) => {
    const { senderId, receiverId, chatId } = data;

    const receiverSocket = users.get(receiverId);
    if (receiverSocket) {
      receiverSocket.forEach((socketId: string) => {
        io.to(socketId).emit("userTyping", {
          senderId,
          isTyping: false,
          chatId,
        });
      });
    }
  });

  socket.on("disconnect", () => {
    const userId = socket.data.userId;

    if (userId) {
      const userSockets = users.get(userId);

      if (userSockets) {
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          users.delete(userId);
          activeUsers.delete(userId);
          broadcastUserStatus(userId, false);
        }
      }
    }

    console.log(
      `User ${userId || "unknown"} disconnected (socket : ${socket.id})`
    );
  });

  socket.on("userLogout", (userId) => {
    if (!userId) return;

    activeUsers.delete(userId);

    if (users.has(userId)) {
      users.delete(userId);
    }

    broadcastUserStatus(userId, false);

    socket.disconnect(true);

    console.log(`User ${userId} logged out`);
  });
});

export { io, server, app, users };
