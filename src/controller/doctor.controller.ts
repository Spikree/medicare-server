import User, { User as UserType } from "../models/user.model";
import patientLabResult from "../models/labresults.model";
import PatientList from "../models/patientlist.model";
import { Request, Response } from "express";

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
    const { name, email } = req.body;

    if (!name && !email) {
      res.status(400).json({
        message: "Enter patient name or email",
      });
      return;
    }

    const patient = (await User.findOne({
      $or: [{ email }, { name: new RegExp(`^${name}$`, "i") }],
    })) as UserType;

    if (!patient) {
      res.status(404).json({
        message: "No patient with this name or email found",
      });
      return;
    }

    const isPatientAlreadyInList = await PatientList.findOne({
      email: patient?.email,
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
  const { title } = req.body;
  const { patientId } = req.params;

  if (!patientId) {
    res.status(400).json({
      message: "Please provide a patient id",
    });

    return;
  }

  try {
    const newPatientLabResult = new patientLabResult({
      title: title,
      labResult: "",
      patient: patientId,
    });

    newPatientLabResult.save();

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
