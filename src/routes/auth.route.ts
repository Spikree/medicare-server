import express from "express";
import { checkAuth, login, logout, register } from "../controller/auth.controller";
import verifyToken from "../middleware/verifytoken.middleware";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/checkAuth", verifyToken,checkAuth);

export default router;
