import express from "express";
import { checkAuth, login, register } from "../controller/auth.controller";
import verifyToken from "../middleware/verifytoken.middleware";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/checkAuth", verifyToken,checkAuth);

export default router;
