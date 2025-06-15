import express from "express";
import {
  addNewPatient,
  addPatientDetails,
  getPatientDetails,
  getPatientList,
  uploadLabResults,
} from "../controller/doctor.controller";
import verifyToken from "../middleware/verifytoken.middleware";
import checkDoctorRole from "../middleware/checkdoctor.middleware";
import upload from "../middleware/multer.middleware";

const router = express.Router();

router.post("/addPatient", verifyToken, checkDoctorRole, addNewPatient);
router.post(
  "/uploadLabResults/:patientId",
  verifyToken,
  upload.single("labFile"),
  uploadLabResults
);
router.get("/getPatientList", verifyToken, checkDoctorRole, getPatientList);
router.post("/addPatientDetails/:patientId", verifyToken, checkDoctorRole,addPatientDetails);
router.get("/getPatientDetails/:patientId", verifyToken, checkDoctorRole, getPatientDetails);

export default router;
