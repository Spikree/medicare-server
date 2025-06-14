import express from "express";
import { addNewPatient, getPatientList, uploadLabResults } from "../controller/doctor.controller";
import verifyToken from "../middleware/verifytoken.middleware";
import checkDoctorRole from "../middleware/checkdoctor.middleware";

const router = express.Router();

router.post("/addPatient", verifyToken, checkDoctorRole, addNewPatient);
router.post("/uploadLabResults/:patientId", verifyToken,uploadLabResults);
router.get("/getPatientList", verifyToken, checkDoctorRole, getPatientList);


export default router;