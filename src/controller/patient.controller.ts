import { Request, Response } from "express";
import PatientList from "../models/patientlist.model";

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
