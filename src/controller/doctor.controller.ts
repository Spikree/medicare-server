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

export const addNewPatient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.body || typeof req.body !== "object") {
      res.status(400).json({
        message: "Invalid request body",
      });
      return;
    }

    const currentUser = req.user;
    const { patientId } = req.body;

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
  try {
    const currentUser = req.user;
    const patientList = await PatientList.find({ doctor: currentUser?._id });

    if (!patientList) {
      res.status(404).json({
        message: "Patient list not found",
      });
      return;
    }

    res.status(200).json({
      message: "Patient list fetched sucessfully",
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
    });

    await newPatientLabResult.save();

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

  try {
    const patient = await User.findById(patientId);

    if (!patient) {
      res.status(404).json({
        message: "No patient with this id",
      });
    }

    const patientDetail = new PatientDetail({
      name: patient?.name,
      patient: patientId,
      doctor: currentUser?.id,
      Disease: Disease,
      symptom: symptom,
      patientExperience: patientExperience,
      medicationPrescribed: medicationPrescribed,
    });

    await patientDetail.save();

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
      doctor: currentUser?._id,
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
    const patientReview = await PatientReview.find({
      patientDetail: patientDetailId,
    });

    if (!patientReview) {
      res.status(404).json({
        message: "No review found",
      });
      return;
    }

    res.status(200).json({
      message: "Fetched all patient reviews sucessfully",
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

export const getPatientDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { patientId } = req.params;

  if (!patientId) {
    res.status(400).json({
      message: "Please provide a patient id",
    });
    return;
  }

  try {
    const patientDetails = await PatientDetail.find({
      patient: patientId,
    }).sort({ createdOn: -1 });

    if (!patientDetails) {
      res.status(404).json({
        message: "No patient details found",
      });
      return;
    }

    res.status(200).json({
      message: "Fetched patient details sucessfully",
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
    const patientLabResults = await patientLabResult.find({
      patient: patientId,
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
      doctor: currentUser?._id
    })

    if(alreadyInPatientList) {
      res.status(400).json({
        message: "This patient is already in your patient list"
      });
      return;
    }

    const existingRequest = await RequestModel.findOne({
      receiver: patientId,
      sender: currentUser?._id,
    });

    if (existingRequest) {
      res.status(400).json({
        message: "You have already sent a request to this patient",
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
