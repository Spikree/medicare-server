import express from "express";
import {
  acceptAddRequest,
  addNewPatient,
  addPatientDetails,
  addPatientRequest,
  addPatientReview,
  editProfile,
  getAllAddRequests,
  getPatientDetails,
  getPatientLabResults,
  getPatientList,
  getPatientReview,
  searchPatients,
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
  checkDoctorRole,
  upload.single("labFile"),
  uploadLabResults
);
router.post("/addPatientDetails/:patientId", verifyToken, checkDoctorRole,addPatientDetails);
router.post("/addPatientReview/:patientDetailId", verifyToken,addPatientReview);
router.post("/searchPatients", verifyToken, checkDoctorRole,searchPatients);
router.post("/addPatientRequest/:patientId", verifyToken, checkDoctorRole,addPatientRequest);
router.post("/acceptAddRequest/:requestId", verifyToken, checkDoctorRole, acceptAddRequest);
// TODO : edit profile
router.post("/editProfile", verifyToken, checkDoctorRole,upload.single("profilePicture"),editProfile);

router.get("/getPatientList", verifyToken, checkDoctorRole, getPatientList);
router.get("/getPatientDetails/:patientId", verifyToken, checkDoctorRole, getPatientDetails);
router.get("/getPatientLabResults/:patientId", verifyToken, checkDoctorRole,getPatientLabResults);
router.get("/getPatientReviews/:patientDetailId", verifyToken, checkDoctorRole,getPatientReview);
router.get("/getAllAddRequests", verifyToken,checkDoctorRole,getAllAddRequests);

export default router;
