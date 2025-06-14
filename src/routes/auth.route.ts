import express, {Router, Request, Response, RequestHandler} from "express";
import { login, register } from "../controller/auth.controller";

const router = express.Router();

router.post("/register", register as unknown as RequestHandler);
router.post("/login", login as unknown as RequestHandler)

export default router;