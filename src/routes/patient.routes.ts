import express from "express";
import verifyToken from "../middleware/verifytoken.middleware";
import checkPatientRole from "../middleware/checkpatient.middleware";
import {
  addAllergiesAndHealthinfo,
  addPatientReview,
  getDoctorList,
  getLabResults,
  getPatientDetails,
  uploadLabResults,
} from "../controller/patient.controller";
import upload from "../middleware/multer.middleware";

const router = express.Router();

router.post(
  "/uploadLabResults",
  verifyToken,
  checkPatientRole,
  upload.single("labFile"),
  uploadLabResults
);
router.post(
  "/uploadAllergiesAndHealthinfo",
  verifyToken,
  checkPatientRole,
  addAllergiesAndHealthinfo
);
router.post("/reviewOnMedication/:patientDetailId", verifyToken, checkPatientRole,addPatientReview);

router.get("/getDoctorList", verifyToken, checkPatientRole, getDoctorList);
router.get("/getLabResults", verifyToken, checkPatientRole, getLabResults);
router.get("/getPatientDetails", verifyToken, checkPatientRole,getPatientDetails);

export default router;
