import express from "express";
import verifyToken from "../middleware/verifytoken.middleware";
import checkPatientRole from "../middleware/checkpatient.middleware";
import {
  acceptAddRequest,
  addAllergiesAndHealthinfo,
  addDoctorRequest,
  addPatientReview,
  assignDoctor,
  getAllAddRequests,
  getAllPatientInfo,
  getDoctorDetails,
  getDoctorList,
  getLabResults,
  getLabResultsByDoctor,
  getPatientDetails,
  getPatientReview,
  removeDoctor,
  searchDoctors,
  uploadLabResults,
} from "../controller/patient.controller";
import upload from "../middleware/multer.middleware";
import { searchPatients } from "../controller/doctor.controller";
import checkDoctorRole from "../middleware/checkdoctor.middleware";

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
  "/addPatientReview/:patientDetailId",
  verifyToken,
  checkPatientRole,
  addPatientReview
);
router.post(
  "/addDoctorRequest/:doctorId",
  verifyToken,
  checkPatientRole,
  addDoctorRequest
);
router.post(
  "/acceptAddRequest/:requestId",
  verifyToken,
  checkPatientRole,
  acceptAddRequest
);
router.post("/searchDoctors", verifyToken, checkPatientRole, searchDoctors);
router.post("/removeDoctor/:doctorId", verifyToken, checkPatientRole,removeDoctor);
router.post("/reassignDoctor/:doctorId", verifyToken,checkPatientRole, assignDoctor);

router.get("/getDoctorList", verifyToken, checkPatientRole, getDoctorList);
router.get("/getLabResults", verifyToken, checkPatientRole, getLabResults);
router.get("/getLabResultsByDoctor/:doctorId", verifyToken, checkPatientRole, getLabResultsByDoctor)
router.get(
  "/getDoctorDetails/:doctorId",
  verifyToken,
  checkPatientRole,
  getDoctorDetails
);
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

router.get("/getPatientReviews/:patientDetailId", verifyToken, checkPatientRole, getPatientReview);

router.get(
  "/getAllInfo",
  verifyToken,
  checkPatientRole,
  getAllPatientInfo
);

export default router;
