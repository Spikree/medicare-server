import express from "express";
import {
  addNewPatient,
  addPatientDetails,
  addPatientReview,
  getPatientDetails,
  getPatientLabResults,
  getPatientList,
  getPatientReview,
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
router.post("/addPatientDetails/:patientId", verifyToken, checkDoctorRole,addPatientDetails);
router.post("/addPatientReview/:patientDetailId", verifyToken,addPatientReview);

router.get("/getPatientList", verifyToken, checkDoctorRole, getPatientList);
router.get("/getPatientDetails/:patientId", verifyToken, checkDoctorRole, getPatientDetails);
router.get("/getPatientLabResults/:patientId", verifyToken, checkDoctorRole,getPatientLabResults);
router.get("/getPatientReviews/:patientDetailId", verifyToken, getPatientReview);

export default router;
