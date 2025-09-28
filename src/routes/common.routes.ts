import express from "express";

import verifyToken from "../middleware/verifytoken.middleware";
import upload from "../middleware/multer.middleware";
import {
  editProfile,
  getAllergiesAndHealthInfo,
  getUserProfile,
} from "../controller/common.controller";

const router = express.Router();

router.post(
  "/updateProfile",
  verifyToken,
  upload.single("profilePicture"),
  editProfile
);
router.get("/getUserProfile/:id", verifyToken, getUserProfile);
router.get(
  "/getAllergiesAndHealthInfo/:patientId",
  verifyToken,
  getAllergiesAndHealthInfo
);

export default router;
