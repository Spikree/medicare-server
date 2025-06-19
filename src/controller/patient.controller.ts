import { Request, Response } from "express";
import PatientList from "../models/patientlist.model";
import patientLabResult from "../models/labresults.model";
import cloudinary from "../lib/cloudinary";
import fs from "fs";
import AllergiesAndGeneralHealthInfo from "../models/allergiesandhealthinfo.model";
import PatientDetail from "../models/patientdetails.model";

export const getDoctorList = async (
  req: Request,
  res: Response
): Promise<void> => {
  const currentUser = req.user;

  try {
    const doctors = await PatientList.find({ patient: currentUser?._id });

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
      patientDetails
    });
  } catch (error) {
    console.log("error in patient controller at get patient details", error);
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};