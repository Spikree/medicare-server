import express from "express";
import verifyToken from "../middleware/verifytoken.middleware";
import { getMessages, sendMessage } from "../controller/chat.controller";

const router = express.Router();

router.get("/getMessages/:id", verifyToken, getMessages);
router.post("/sendMessage/:id", verifyToken, sendMessage);

export default router;