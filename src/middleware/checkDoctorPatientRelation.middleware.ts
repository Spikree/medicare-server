import User from "../models/user.model";
import PatientList from "../models/patientlist.model";
import { NextFunction, Request, Response } from "express";

const checkDoctorPatientRelation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { patientId } = req.params;
  try {
    const patient = await PatientList.findOne({ patient: patientId });

    if (!patient) {
      res.status(404).json({
        message: "This patient is not in your patient list",
      });
      return;
    }

    if (patient.patientStatus === "old") {
      res.status(400).json({
        message: "This patient is currently not assigned to you",
      });
      return;
    }

    next();
  } catch (error) {}
};

export default checkDoctorPatientRelation;
