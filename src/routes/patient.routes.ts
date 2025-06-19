import express from "express";
import verifyToken from "../middleware/verifytoken.middleware";
import checkPatientRole from "../middleware/checkpatient.middleware";
import { getDoctorList, uploadLabResults } from "../controller/patient.controller";
import upload from "../middleware/multer.middleware";

const router = express.Router();

router.post("/uploadLabResults", verifyToken, checkPatientRole,upload.single("labFile"), uploadLabResults)

router.get("/getDoctorList",verifyToken, checkPatientRole, getDoctorList);

export default router;