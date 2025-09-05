import { Server } from "socket.io";
import express from "express";
import http from "http";
import { User } from "../models/user.model.js";
import { Group } from "../models/group.model.js";

async function updateGrpOnlineMembers(userId, action) {
  const user = await User.findById(userId);
  if (user) {
    for (const groupId of user.groupJoined?.map((g) => g._id)) {
      const group = await Group.findById(groupId);

      action === "push"
        ? !group.onlineMembers.includes(userId) &&
          group.onlineMembers.push(userId)
        : group.onlineMembers.pull(userId);

      const otherMembers = group.members.map(
        (m) => m.memberId !== userId && m.memberId.toString()
      );

      for (const mId of otherMembers) {
        const socketId = getUserSocketId(mId);
        if (socketId) {
          io.to(socketId).emit("grpOnlineMember", { action, groupId, userId });
        }
      }

      await group.save();
    }
  }
}

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.URL,
    methods: ["GET", "POST"],
  },
});

//this map stores the socket id corresponding to user id
export const userSocketMap = {};

io.on("connection", async (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    updateGrpOnlineMembers(userId, "push");

    // console.log(`User connected..   User id: ${userId}  Socket id: ${socket.id}`)
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", async () => {
    if (userId) {
      delete userSocketMap[userId];
      updateGrpOnlineMembers(userId, "pull");

      // console.log(`User disconnected..  User id: ${userId}  Socket id: ${socket.id}`)
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { app, server, io };

export function getUserSocketId(receiverId) {
  return userSocketMap[receiverId];
}
