import express, { RequestHandler } from "express";
import { addNewPatient } from "../controller/doctor.controller";
import verifyToken from "../middleware/verifytoken.middleware";

const router = express.Router();

router.post("/addPatient", verifyToken, addNewPatient);

export default router;