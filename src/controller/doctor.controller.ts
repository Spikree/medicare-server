import User, { User as UserType } from "../models/user.models";
import PatientList from "../models/patientlist.model";
import { Request, Response } from "express";

export const addNewPatient = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      message: "Invalid request body",
    });
  }

  const currentUser = req.user;
  const { name, email } = req.body;

  if (!name && !email) {
    return res.status(400).json({
      message: "Enter patient name or email",
    });
  }

  try {
    const patient = (await User.findOne({
      $or: [{ email }, { name: new RegExp(`^${name}$`, "i") }],
    })) as UserType;

    if (!patient) {
      return res.status(404).json({
        message: "No patient with this name or email found",
      });
    }

    const isPatientAlreadyInList = await PatientList.findOne({
      email: patient?.email,
    });

    if (isPatientAlreadyInList) {
      return res.status(400).json({
        message: "You already have this patient in your patient list",
      });
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

    return res.status(200).json({
      message: "New patient added sucessfully",
      newPatient,
    });
  } catch (error: any) {
    console.log("error in doctor controller at add new patient", error.message);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};