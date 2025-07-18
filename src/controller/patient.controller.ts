import { Request, Response } from "express";
import PatientList from "../models/patientlist.model";
import patientLabResult from "../models/labresults.model";
import cloudinary from "../lib/cloudinary";
import fs from "fs";
import AllergiesAndGeneralHealthInfo from "../models/allergiesandhealthinfo.model";
import PatientDetail from "../models/patientdetails.model";
import PatientReview from "../models/patientreview.model";
import RequestModel from "../models/request.model";
import UserModel from "../models/user.model";

export const getDoctorList = async (
  req: Request,
  res: Response
): Promise<void> => {
  const currentUser = req.user;

  try {
    const doctors = await PatientList.find({
      patient: currentUser?._id,
    }).populate("doctor", "name email");

    if (!doctors) {
      res.status(404).json({
        message: "Doctors for this patient does not exist",
      });
      return;
    }

    res.status(200).json({
      message: "Fetched doctors list sucessfully",
      doctors,
    });
  } catch (error) {
    console.log("error in patient controller at get doctor list Review", error);
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};

export const uploadLabResults = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.body || typeof req.body !== "object") {
    res.status(400).json({
      message: "Invalid request body",
    });
    return;
  }

  const { title } = req.body;
  const currentUser = req.user;

  if (!req.file) {
    res.status(400).json({ message: "No file uploaded" });
    return;
  }

  try {
    const cloudinaryResult = await cloudinary.uploader.upload(req.file?.path!, {
      folder: "lab-results",
    });

    if (req.file?.path) {
      fs.unlinkSync(req.file?.path);
    }

    const fileLink = cloudinaryResult.secure_url;

    const newPatientLabResult = new patientLabResult({
      title: title,
      labResult: fileLink,
      patient: currentUser?._id,
    });

    await newPatientLabResult.save();

    res.status(200).json({
      message: "Patient lab result uploaded sucessfully",
      newPatientLabResult,
    });
  } catch (error: unknown) {
    console.log("error in patient controller at upload lab results", error);
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};

export const addAllergiesAndHealthinfo = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.body || typeof req.body !== "object") {
    res.status(400).json({
      message: "Invalid request body",
    });
    return;
  }

  const currentUser = req.user;

  const { allergies, generalHealthInfo } = req.body;

  if (!allergies && !generalHealthInfo) {
    res.status(400).json({
      message: "please fill in the allergies or health info",
    });
    return;
  }

  try {
    const allergiesAndGeneralHealthInfo = new AllergiesAndGeneralHealthInfo({
      patient: currentUser?._id,
      allergies: allergies,
      generalHealthInfo: generalHealthInfo,
    });

    await allergiesAndGeneralHealthInfo.save();

    res.status(200).json({
      message: "saved allergies and general health info",
      allergiesAndGeneralHealthInfo,
    });
  } catch (error) {
    console.log(
      "error in patient controller at upload Allergies And Health info",
      error
    );
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};

export const getLabResults = async (req: Request, res: Response) => {
  const currentUser = req.user;

  try {
    const patientLabResults = await patientLabResult.find({
      patient: currentUser?._id,
    });

    if (!patientLabResults) {
      res.status(404).json({
        message: "Patient lab results not found",
      });

      return;
    }

    res.status(200).json({
      message: "Fetched patient lab results sucessfully",
      patientLabResults,
    });
  } catch (error) {
    console.log("error in patient controller at get lab results", error);
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};

export const getPatientDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  const currentUser = req.user;

  try {
    const patientDetails = await PatientDetail.find({
      patient: currentUser?._id,
    });

    if (!patientDetails) {
      res.status(404).json({
        message: "No details on this patient found",
      });
      return;
    }

    res.status(200).json({
      message: "Patient details fetched sucessfully",
      patientDetails,
    });
  } catch (error) {
    console.log("error in patient controller at get patient details", error);
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};

export const addPatientReview = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { patientDetailId } = req.params;

  if (!req.body || typeof req.body !== "object") {
    res.status(400).json({
      message: "Invalid request body",
    });
    return;
  }

  const { patientReview, sideEffects } = req.body;

  if (!patientDetailId) {
    res.status(400).json({
      message: "Please provide patient details id",
    });
    return;
  }

  try {
    const patientDetails = await PatientDetail.findById(patientDetailId);

    const newPatientReview = new PatientReview({
      name: patientDetails?.name,
      patient: patientDetails?.patient,
      patientDetail: patientDetailId,
      patientReview: patientReview,
      sideEffects: sideEffects,
    });

    await newPatientReview.save();

    res.status(200).json({
      message: "Added new patient review",
      newPatientReview,
    });
  } catch (error) {
    console.log("error in patient controller at add Patient Review", error);
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};

export const addDoctorRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { doctorId } = req.params;
  const currentUser = req.user;

  if (!doctorId) {
    res.status(400).json({
      message: "Please provide a patient id",
    });
    return;
  }

  try {
    const newRequest = new RequestModel({
      sender: currentUser?._id,
      receiver: doctorId,
    });

    newRequest.save();

    res.status(200).json({
      message: "Request sent",
      newRequest,
    });
  } catch (error) {
    console.log("error in add doctor request in patient controller" + error);
    res.status(500).json({
      message: "Internal Server Error",
    });
    return;
  }
};

export const getAllAddRequests = async (
  req: Request,
  res: Response
): Promise<void> => {
  const currentUser = req.user;

  try {
    const requests = await RequestModel.find({
      receiver: currentUser?._id,
    });

    if (!requests) {
      res.status(404).json({
        message: "No requests found",
      });
      return;
    }

    res.status(200).json({
      message: "Fetched all the requests",
      requests,
    });
  } catch (error) {
    console.log("error in get all requests in patient controller" + error);
    res.status(500).json({
      message: "Internal Server Error",
    });
    return;
  }
};

export const acceptAddRequest = async (req: Request, res: Response) => {
  const { requestId } = req.params;
  const currentUser = req.user;

  if (!requestId) {
    res.status(400).json({
      message: "please provide a request id",
    });
    return;
  }

  try {
    const request = await RequestModel.findOne({
      _id: requestId,
    });

    const doctor = await UserModel.findById(request?.sender);

    const newPatient = new PatientList({
      name: currentUser?.name,
      email: currentUser?.email,
      bio: currentUser?.bio,
      doctor: doctor?._id,
      patient: currentUser?._id,
    });
  } catch (error) {
    console.log("error in acceptAddRequest in patient controller" + error);
    res.status(500).json({
      message: "Internal Server Error",
    });
    return;
  }
};
