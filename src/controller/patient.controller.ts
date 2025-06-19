import { Request, Response } from "express";
import PatientList from "../models/patientlist.model";
import patientLabResult from "../models/labresults.model";
import cloudinary from "../lib/cloudinary";
import fs from "fs";

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