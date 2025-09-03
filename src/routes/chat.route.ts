import express from "express";
import verifyToken from "../middleware/verifytoken.middleware";
import { getMessages, sendMessage } from "../controller/chat.controller";
import upload from "../middleware/multer.middleware";

const router = express.Router();

router.get("/getMessages/:id", verifyToken, getMessages);
router.post(
  "/sendMessage/:id",
  verifyToken,
  upload.single("image"),
  sendMessage
);

export default router;
