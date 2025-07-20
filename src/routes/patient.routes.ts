import express from "express";
import verifyToken from "../middleware/verifytoken.middleware";
import checkPatientRole from "../middleware/checkpatient.middleware";
import {
  acceptAddRequest,
  addAllergiesAndHealthinfo,
  addDoctorRequest,
  addPatientReview,
  getAllAddRequests,
  getDoctorList,
  getLabResults,
  getPatientDetails,
  searchDoctors,
  uploadLabResults,
} from "../controller/patient.controller";
import upload from "../middleware/multer.middleware";
import { searchPatients } from "../controller/doctor.controller";

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
router.post(
  "/reviewOnMedication/:patientDetailId",
  verifyToken,
  checkPatientRole,
  addPatientReview
);
router.post("/addDoctorRequest/:doctorId", verifyToken, checkPatientRole, addDoctorRequest);
router.post("/acceptAddRequest/:requestId", verifyToken, checkPatientRole,acceptAddRequest );
router.post("/searchDoctors", verifyToken,checkPatientRole, searchDoctors);

router.get("/getDoctorList", verifyToken, checkPatientRole, getDoctorList);
router.get("/getLabResults", verifyToken, checkPatientRole, getLabResults);
router.get(
  "/getPatientDetails",
  verifyToken,
  checkPatientRole,
  getPatientDetails
);
router.get(
  "/getAllAddRequests",
  verifyToken,
  checkPatientRole,
  getAllAddRequests
);

export default router;
