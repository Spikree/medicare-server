import express from "express";
import verifyToken from "../middleware/verifytoken.middleware";
import checkPatientRole from "../middleware/checkpatient.middleware";
import { getDoctorList } from "../controller/patient.controller";

const router = express.Router();

router.get("/getDoctorList",verifyToken, checkPatientRole, getDoctorList);

export default router;