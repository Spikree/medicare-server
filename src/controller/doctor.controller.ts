import User, { User as UserType } from "../models/user.model";
import patientLabResult from "../models/labresults.model";
import cloudinary from "../lib/cloudinary";
import PatientList from "../models/patientlist.model";
import { Request, Response } from "express";
import fs from "fs";
import PatientDetail from "../models/patientdetails.model";
import PatientReview from "../models/patientreview.model";
import RequestModel from "../models/request.model";
import UserModel from "../models/user.model";
import { encryptString, decryptString } from "../lib/crypto";
import { getCloudinaryPublicId } from "../lib/utils";
import AllergiesAndGeneralHealthInfo from "../models/allergiesandhealthinfo.model";
import { generateAIResponse } from "../lib/AiSummary";
import AiChatHistory from "../models/AiChatHistory.model";
import redisClient from "../lib/redisClient";

const defaultRedisExpiry: number = 3600;

export const addNewPatient = async (
  req: Request,
  res: Response
): Promise<void> => {
  const currentUser = req.user;
  const { patientId } = req.body;

  const cacheKeyToDelete = `getPatientList:${currentUser?._id}`;
  const cacheKeyToDeleteForPatientSide = `getDoctorList:${currentUser?._id}`;

  try {
    if (!req.body || typeof req.body !== "object") {
      res.status(400).json({
        message: "Invalid request body",
      });
      return;
    }

    if (!patientId) {
      res.status(400).json({
        message: "Please provide a patient id",
      });
      return;
    }

    const patient = (await User.findById(patientId)) as UserType | null;

    if (!patient) {
      res.status(404).json({
        message: "Patient not found",
      });
      return;
    }

    const isPatientAlreadyInList = await PatientList.findOne({
      email: patient?.email,
      doctor: currentUser?._id,
    });

    if (isPatientAlreadyInList) {
      res.status(400).json({
        message: "You already have this patient in your patient list",
      });
      return;
    }

    const newPatient = new PatientList({
      name: patient?.name,
      email: patient?.email,
      bio: patient?.bio,
      profilePicture: patient?.profilePicture,
      patient: patient?._id,
      doctor: currentUser?._id,
      patientStatus: "current",
    });

    await newPatient.save();

    await redisClient.del(cacheKeyToDelete);
    await redisClient.del(cacheKeyToDeleteForPatientSide);

    res.status(200).json({
      message: "New patient added sucessfully",
      newPatient,
    });
  } catch (error: unknown) {
    console.log("error in doctor controller at add new patient", error);
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};

export const getPatientList = async (
  req: Request,
  res: Response
): Promise<void> => {
  const currentUser = req.user;

  try {
    const cacheKey = `getPatientList:${currentUser?._id}`;
    const cachedPatients = await redisClient.get(cacheKey);

    if (cachedPatients) {
      res.status(200).json({
        message: "Patient list fetched sucessfully (from cache)",
        patientList: JSON.parse(cachedPatients),
      });
      return;
    }

    const patientList = await PatientList.find({
      doctor: currentUser?._id,
    });

    if (!patientList) {
      res.status(404).json({
        message: "Patient list not found",
      });
      return;
    }

    await redisClient.setEx(
      cacheKey,
      defaultRedisExpiry,
      JSON.stringify(patientList)
    );

    res.status(200).json({
      message: "Patient list fetched successfully (from DB)",
      patientList,
    });
  } catch (error: unknown) {
    console.log("error in doctor controller at get patient list", error);
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
  const { patientId } = req.params;
  const currentUser = req.user;

  const cacheKeyToDelete = `getPatientLabResults:${patientId}`;
  const cacheKeyToDeleteForPatientSide = `getLabResultsByDoctor:${currentUser?._id}:${patientId}`;

  if (!patientId) {
    res.status(400).json({
      message: "Please provide a patient id",
    });
    return;
  }

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
      patient: patientId,
      addedBy: currentUser?._id,
    });

    await newPatientLabResult.save();

    await redisClient.del(cacheKeyToDelete);
    await redisClient.del(cacheKeyToDeleteForPatientSide);

    res.status(200).json({
      message: "Patient lab result uploaded sucessfully",
      newPatientLabResult,
    });
  } catch (error: unknown) {
    console.log("error in doctor controller at upload lab results", error);
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};

export const addPatientDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.body || typeof req.body !== "object") {
    res.status(400).json({
      message: "Invalid request body",
    });
    return;
  }
  const { Disease, symptom, patientExperience, medicationPrescribed } =
    req.body;
  const { patientId } = req.params;
  const currentUser = req.user;

  if (!Disease || !symptom || !patientExperience || !medicationPrescribed) {
    res.status(400).json({
      message: "Please fill in the required fields",
    });
    return;
  }

  if (!patientId) {
    res.status(400).json({
      message: "please provide a patient id",
    });
    return;
  }

  const cacheKeyToDelete = `getPatientDetails:${patientId}`;
  const cacheKeyToDeleteForPatientSide = `getDoctorDetails:${currentUser?._id}`;

  try {
    const patient = await User.findById(patientId);

    if (!patient) {
      res.status(404).json({
        message: "No patient with this id",
      });
      return;
    }

    const patientDetail = new PatientDetail({
      name: patient?.name,
      patient: patientId,
      doctor: currentUser?.id,
      Disease: encryptString(Disease),
      symptom: encryptString(symptom),
      patientExperience: encryptString(patientExperience),
      medicationPrescribed: encryptString(medicationPrescribed),
    });

    await patientDetail.save();

    await redisClient.del(cacheKeyToDelete);
    await redisClient.del(cacheKeyToDeleteForPatientSide);

    res.status(200).json({
      message: "Patient details added sucessfully",
      patientDetail,
    });
  } catch (error) {
    console.log("error in doctor controller at add patient details", error);
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
  const currentUser = req.user;

  const cacheKeyToDelete = `getPatientReviews:${patientDetailId}`;

  if (!req.body || typeof req.body !== "object") {
    res.status(400).json({
      message: "Invalid request body",
    });
    return;
  }

  const { patientReview, sideEffects, reviewBy } = req.body;

  if (!patientDetailId) {
    res.status(400).json({
      message: "Please provide patient details id",
    });
    return;
  }

  try {
    const patientDetails = await PatientDetail.findById(patientDetailId);

    const patientList = await PatientList.findOne({patient: patientDetails?.patient});

    if(patientList?.patientStatus === "old") {
      res.status(400).json({
        message: "This patient is currently not assigned to you",
      });
      return;
    };


    const newPatientReview = new PatientReview({
      name: patientDetails?.name,
      patient: patientDetails?.patient,
      doctor: currentUser?._id,
      patientDetail: patientDetailId,
      patientReview: patientReview,
      reviewBy: reviewBy,
      sideEffects: sideEffects,
    });

    await newPatientReview.save();

    await redisClient.del(cacheKeyToDelete);

    res.status(200).json({
      message: "Added new patient review",
      newPatientReview,
    });
  } catch (error) {
    console.log("error in doctor controller at add Patient Review", error);
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};

export const getPatientReview = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { patientDetailId } = req.params;

  if (!patientDetailId) {
    res.status(400).json({
      message: "Please provide patient details id",
    });
    return;
  }

  try {
    const cacheKey = `getPatientReviews:${patientDetailId}`;
    const cachedPatientReviews = await redisClient.get(cacheKey);

    if (cachedPatientReviews) {
      res.status(200).json({
        message: "Fetched all patient reviews sucessfully ( from cache )",
        patientReview: JSON.parse(cachedPatientReviews),
      });
      return;
    }

    const patientReview = await PatientReview.find({
      patientDetail: patientDetailId,
    })
      .populate("doctor", "name email")
      .populate("patient", "name email");

    if (!patientReview) {
      res.status(404).json({
        message: "No review found",
      });
      return;
    }

    await redisClient.setEx(
      cacheKey,
      defaultRedisExpiry,
      JSON.stringify(patientReview)
    );

    res.status(200).json({
      message: "Fetched all patient reviews sucessfully ( from db )",
      patientReview,
    });
  } catch (error) {
    console.log("error in doctor controller at get patient reviews", error);
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};

// encrypt the cached data according to the compliance
export const getPatientDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { patientId } = req.params;
  const currentUser = req.user;


  if (!patientId) {
    res.status(400).json({
      message: "Please provide a patient id",
    });
    return;
  }

  try {

    const patientDetail = await PatientList.findOne({
      patient: patientId,
      doctor: currentUser?._id
    });

    if(!patientDetail?.patientDataAccess) {
      res.status(400).json({
        message: "You do not have access to patient data"
      });
      return;
    }

    const cacheKey = `getPatientDetails:${patientId}`;

    const cachedPatientDetails = await redisClient.get(cacheKey);

    if (cachedPatientDetails) {
      res.status(200).json({
        message: "Fetched patient details sucessfully ( from cache )",
        patientDetails: JSON.parse(cachedPatientDetails),
      });
      return;
    }

    const patientDetailsEncrypted = await PatientDetail.find({
      patient: patientId,
    })
      .sort({ createdOn: -1 })
      .lean();

    if (!patientDetailsEncrypted) {
      res.status(404).json({
        message: "No patient details found",
      });
      return;
    }

    const patientDetails = patientDetailsEncrypted.map((detail) => ({
      ...detail,
      Disease: decryptString(detail.Disease),
      symptom: decryptString(detail.symptom),
      patientExperience: decryptString(detail.patientExperience),
      medicationPrescribed: decryptString(detail.medicationPrescribed),
    }));

    await redisClient.setEx(
      cacheKey,
      defaultRedisExpiry,
      JSON.stringify(patientDetails)
    );

    res.status(200).json({
      message: "Fetched patient details sucessfully ( from db )",
      patientDetails,
    });
  } catch (error) {
    console.log("error in doctor controller at get patient details", error);
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};

export const getPatientLabResults = async (req: Request, res: Response) => {
  const { patientId } = req.params;

  if (!patientId) {
    res.status(400).json({
      message: "Please provide a patient id",
    });
    return;
  }

  try {
    const cacheKey = `getPatientLabResults:${patientId}`;
    const cachedPatientLabDetails = await redisClient.get(cacheKey);

    if (cachedPatientLabDetails) {
      res.status(200).json({
        message: "Fetched patient lab results sucessfully ( from cache )",
        patientLabResults: JSON.parse(cachedPatientLabDetails),
      });
      return;
    }

    const patientLabResults = await patientLabResult
      .find({
        patient: patientId,
      })
      .sort({ createdOn: -1 })
      .lean();

    if (!patientLabResults) {
      res.status(404).json({
        message: "Patient lab results not found",
      });

      return;
    }

    await redisClient.setEx(
      cacheKey,
      defaultRedisExpiry,
      JSON.stringify(patientLabResults)
    );

    res.status(200).json({
      message: "Fetched patient lab results sucessfully ( from db )",
      patientLabResults,
    });
  } catch (error) {
    console.log("error in doctor controller at get patient lab results", error);
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};

export const searchPatients = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.body || typeof req.body !== "object") {
    res.status(400).json({
      message: "Invalid request body",
    });
    return;
  }
  const { patientName, patientEmail } = req.body;

  let orCondition = [];

  try {
    if (patientName) {
      orCondition.push({ name: { $regex: patientName, $options: "i" } });
    }

    if (patientEmail) {
      orCondition.push({ email: { $regex: patientEmail, $options: "i" } });
    }

    const query =
      orCondition.length > 0
        ? { $and: [{ role: "patient" }, { $or: orCondition }] }
        : { role: "patient" };

    const patients = await User.find(query).select("-password").lean();

    res.status(200).json({
      patients,
      message: "fetched patients sucessfully",
    });
  } catch (error) {
    console.log(
      "error in doctor controller at search patients lab results",
      error
    );
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};

export const addPatientRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { patientId } = req.params;
  const currentUser = req.user;

  if (!patientId) {
    res.status(400).json({
      message: "Please provide a patient id",
    });
    return;
  }

  try {
    const alreadyInPatientList = await PatientList.findOne({
      patient: patientId,
      doctor: currentUser?._id,
    });

    if (alreadyInPatientList) {
      res.status(400).json({
        message: "This patient is already in your patient list",
      });
      return;
    }

    const existingRequest = await RequestModel.findOne({
      receiver: patientId,
      sender: currentUser?._id,
    });

    const existingRequest2 = await RequestModel.findOne({
      receiver: currentUser?._id,
      sender: patientId,
    });

    if (existingRequest || existingRequest2) {
      res.status(400).json({
        message:
          "Either this user has sent you a request or you have already sent one request",
      });
      return;
    }

    const newRequest = new RequestModel({
      sender: currentUser?._id,
      receiver: patientId,
    });

    newRequest.save();

    res.status(200).json({
      message: "Request sent",
      newRequest,
    });
  } catch (error) {
    console.log("error in add patient request in doctor controller" + error);
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
    })
      .populate("receiver", "name email profilePicture")
      .populate("sender", "name email profilePicture");

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
    console.log("error in get all requests in doctor controller" + error);
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

    const cacheKeyToDelete = `getPatientList:${currentUser?._id}`;
    const cacheKeyToDeleteForPatientSide = `getDoctorList:${request?.sender}`;

    const patient = await UserModel.findById(request?.sender);

    const newPatient = new PatientList({
      name: patient?.name,
      email: patient?.email,
      bio: patient?.bio,
      doctor: currentUser?._id,
      patient: patient?._id,
    });

    await newPatient.save();

    await request?.deleteOne();

    await redisClient.del(cacheKeyToDelete);
    await redisClient.del(cacheKeyToDeleteForPatientSide);

    res.status(200).json({
      message: "Patient added sucessfully",
      newPatient,
    });
  } catch (error) {
    console.log("error in acceptAddRequest in doctor controller" + error);
    res.status(500).json({
      message: "Internal Server Error",
    });
    return;
  }
};

export const getAllPatientInfo = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { patientId } = req.params;

  try {
    const userInfo = await UserModel.findById(patientId).select("-password");

    const patientDetails = await PatientDetail.find({
      patient: patientId,
    }).populate("doctor", "name email");

    const allergiesAndHealthInfo = await AllergiesAndGeneralHealthInfo.find({
      patient: patientId,
    });

    const labResults = await patientLabResult
      .find({
        patient: patientId,
      })
      .populate("addedBy", "name email");

    const patientReviews = await PatientReview.find({
      patient: patientId,
    }).populate("patientDetail", "Disease symptom medicationPrescribed");

    const doctorList = await PatientList.find({
      patient: patientId,
    }).populate("doctor", "name email bio");

    const allPatientInfo = {
      userInfo,
      patientDetails,
      allergiesAndHealthInfo,
      labResults,
      patientReviews,
      doctorList,
      summary: {
        totalMedicalRecords: patientDetails.length,
        totalLabResults: labResults.length,
        totalReviews: patientReviews.length,
        totalDoctors: doctorList.length,
      },
    };

    res.status(200).json({
      message: "All patient information fetched successfully",
      allPatientInfo,
    });
  } catch (error) {
    console.log("error in doctor controller at get all patient info", error);
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};
