import chatModel from "../models/chat.model";
import cloudinary from "../lib/cloudinary";
import { Request, Response } from "express";
import fs from "fs";
import User from "../models/user.model";

export const getMessages = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id: receiverId } = req.params;
  const currentUser = req.user;
  const myId = currentUser?._id;

  try {
    const chatId = [myId?.toString(), receiverId.toString()].sort().join("_");

    const messages = await chatModel
      .find({
        chatId,
      })
      .sort({
        createdAt: -1,
      });

    if (messages.length === 0) {
      res.status(200).json({
        message: "Chat is empty",
        messages,
      });
      return;
    }

    res.status(200).json({
      message: "Fetch All Messages",
      messages,
    });
  } catch (error) {
    console.log("error in chat controller at get messages", error);
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};

export const sendMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id: receiverId } = req.params;
  const { text } = req.body;
  const currentUser = req.user;
  const myId = currentUser?._id;

  if (!text) {
    res.status(400).json({
      message: "Text or image is required",
    });
    return;
  }

  try {
    const receiverExists = await User.findById(receiverId);

    if (!receiverExists) {
      res.status(404).json({
        message: "User does not exist",
      });
      return;
    }

    const chatId = [myId?.toString(), receiverId.toString()].sort().join("_");

    const newMessage = new chatModel({
      senderId: myId,
      receiverId: receiverId,
      text,
      chatId,
    });

    await newMessage.save();

    res.status(200).json({
      message: "message sent sucessfully",
    });
  } catch (error) {
    console.log("Error in chat controller at send message" + error);
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};
