import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://medicare-client.onrender.com"],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (Socket) => {
  console.log(`A user connected: ${Socket.id}`);
});

export { io, server, app };