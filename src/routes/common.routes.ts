import express from "express";

import verifyToken from "../middleware/verifytoken.middleware";
import upload from "../middleware/multer.middleware";
import { editProfile } from "../controller/common.controller";

const router = express.Router();

router.post("/updateProfile", verifyToken, upload.single("profilePicture"), editProfile);

export default router;