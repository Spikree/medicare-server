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
import { decryptString } from "../lib/crypto";
import redisClient from "../lib/redisClient";

const defaultRedisExpiry: number = 3600;

export const getDoctorList = async (
  req: Request,
  res: Response
): Promise<void> => {
  const currentUser = req.user;

  try {
    const caheKey = `getDoctorList:${currentUser?._id}`;

    const cachedDoctorList = await redisClient.get(caheKey);

    if (cachedDoctorList) {
      res.status(200).json({
        message: "Fetched doctors list sucessfully ( from cache )",
        doctors: JSON.parse(cachedDoctorList),
      });
      return;
    }

    const doctors = await PatientList.find({
      patient: currentUser?._id,
    }).populate("doctor", "name email");

    if (!doctors) {
      res.status(404).json({
        message: "Doctors for this patient does not exist",
      });
      return;
    }

    await redisClient.setEx(
      caheKey,
      defaultRedisExpiry,
      JSON.stringify(doctors)
    );

    res.status(200).json({
      message: "Fetched doctors list sucessfully ( from db )",
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
      addedBy: currentUser?._id,
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

  const cacheKey = `getLabResults:${currentUser?._id}`;

  try {
    const cachedLabResults = await redisClient.get(cacheKey);

    if (cachedLabResults) {
      res.status(200).json({
        message: "Fetched patient lab results sucessfully ( from cache )",
        patientLabResults: JSON.parse(cachedLabResults),
      });
      return;
    }

    const patientLabResults = await patientLabResult.find({
      patient: currentUser?._id,
    });

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

  const { patientReview, sideEffects, reviewBy } = req.body;

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
      reviewBy: reviewBy,
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
    const alreadyInPatientList = await PatientList.findOne({
      patient: currentUser?._id,
      doctor: doctorId,
    });

    if (alreadyInPatientList) {
      res.status(400).json({
        message: "This doctor is already in your doctor list",
      });
      return;
    }

    const existingRequest = await RequestModel.findOne({
      receiver: doctorId,
      sender: currentUser?._id,
    });

    const existingRequest2 = await RequestModel.findOne({
      receiver: currentUser?._id,
      sender: doctorId,
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
    })
      .populate("sender", "name email profilePicture")
      .populate("receiver", "name email profilePicture");

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

    await newPatient.save();

    await request?.deleteOne();

    res.status(200).json({
      message: "New patient added",
      newPatient,
    });
  } catch (error) {
    console.log("error in acceptAddRequest in patient controller" + error);
    res.status(500).json({
      message: "Internal Server Error",
    });
    return;
  }
};

export const searchDoctors = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.body || typeof req.body !== "object") {
    res.status(400).json({
      message: "Invalid request body",
    });
    return;
  }
  const { doctorName, doctorEmail } = req.body;

  let orCondition = [];

  try {
    if (doctorName) {
      orCondition.push({ name: { $regex: doctorName, $options: "i" } });
    }

    if (doctorEmail) {
      orCondition.push({ email: { $regex: doctorEmail, $options: "i" } });
    }

    const query =
      orCondition.length > 0
        ? { $and: [{ role: "doctor" }, { $or: orCondition }] }
        : { role: "doctor" };

    const doctors = await UserModel.find(query).select("-password").lean();

    res.status(200).json({
      doctors,
      message: "fetched patients sucessfully",
    });
  } catch (error) {
    console.log("error in patient controller at search doctors", error);
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};

export const getDoctorDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { doctorId } = req.params;

  if (!doctorId) {
    res.status(400).json({
      message: "doctor id isnt provided",
    });
    return;
  }

  try {
    const doctorDetailsEncrypted = await PatientDetail.find({
      doctor: doctorId,
    })
      .sort({ createdOn: -1 })
      .lean();

    if (!doctorDetailsEncrypted) {
      res.status(404).json({
        message: "Doctor details not founds",
      });
      return;
    }

    const doctorDetails = doctorDetailsEncrypted.map((detail) => ({
      ...detail,
      Disease: decryptString(detail.Disease),
      symptom: decryptString(detail.symptom),
      patientExperience: decryptString(detail.patientExperience),
      medicationPrescribed: decryptString(detail.medicationPrescribed),
    }));

    res.status(200).json({
      doctorDetails,
      message: "Doctor details fetched sucessfully",
    });
  } catch (error) {
    console.log("error in patient controller at get doctor details", error);
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
      message: "patient detail id is missing",
    });
    return;
  }

  try {
    const patientReviews = await PatientReview.find({
      patientDetail: patientDetailId,
    })
      .populate("doctor", "name email")
      .populate("patient", "name email");

    if (!patientReviews) {
      res.status(404).json({
        message: "Fetched patient reviews",
        patientReviews,
      });
      return;
    }

    res.status(200).json({
      message: "Fetched patient reviews",
      patientReviews,
    });
  } catch (error) {
    console.log("error in patient controller at get patient reviews", error);
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};

export const getLabResultsByDoctor = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { doctorId } = req.params;
  const currentUser = req.user;

  if (!doctorId) {
    res.status(400).json({
      message: "doctor id is missing",
    });
    return;
  }

  try {
    const labResultsByDoctor = await patientLabResult.find({
      addedBy: doctorId,
      patient: currentUser?._id,
    });

    if (!labResultsByDoctor) {
      res.status(404).json({
        message: "No lab results by doctor found",
      });
      return;
    }

    res.status(200).json({
      message: "Fetched lab results by doctor sucessfully",
      labResultsByDoctor,
    });
  } catch (error) {
    console.log(
      "error in patient controller at get lab results by doctor route",
      error
    );
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};

export const getAllPatientInfo = async (
  req: Request,
  res: Response
): Promise<void> => {
  const currentUser = req.user;

  try {
    const userInfo = await UserModel.findById(currentUser?._id).select(
      "-password"
    );

    const patientDetails = await PatientDetail.find({
      patient: currentUser?._id,
    }).populate("doctor", "name email");

    const allergiesAndHealthInfo = await AllergiesAndGeneralHealthInfo.find({
      patient: currentUser?._id,
    });

    const labResults = await patientLabResult
      .find({
        patient: currentUser?._id,
      })
      .populate("addedBy", "name email");

    const patientReviews = await PatientReview.find({
      patient: currentUser?._id,
    }).populate("patientDetail", "Disease symptom medicationPrescribed");

    const doctorList = await PatientList.find({
      patient: currentUser?._id,
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
    console.log("error in patient controller at get all patient info", error);
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};

export const removeDoctor = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { doctorId } = req.params;
  const currentUser = req.user;

  if (!doctorId) {
    res.status(400).json({
      message: "Doctor Id is not provided",
    });
    return;
  }

  try {
    await PatientList.updateOne(
      { doctor: doctorId, patient: currentUser?._id },
      { $set: { patientStatus: "old" } }
    );

    res.status(200).json({
      message: "Doctor removed",
    });
  } catch (error) {
    console.log("error in patient controllers at remove doctor", error);
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};

export const assignDoctor = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { doctorId } = req.params;
  const currentUser = req.user;

  if (!doctorId) {
    res.status(400).json({
      message: "Doctor Id is not provided",
    });
    return;
  }

  try {
    await PatientList.updateOne(
      { doctor: doctorId, patient: currentUser?._id },
      { $set: { patientStatus: "current" } }
    );

    res.status(200).json({
      message: "Doctor reassigned",
    });
  } catch (error) {
    console.log("error in patient controllers at reassign doctor", error);
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};
