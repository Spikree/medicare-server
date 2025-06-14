import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model";

const checkDoctorRole = (
  req: Request & { user?: User },
  res: Response,
  next: NextFunction
): void => {
  const user = req.user;

  if (user?.role !== "doctor") {
    res.status(403).json({ message: "Access denied, Freelancers only" });
    return;
  }
  next();
};

export default checkDoctorRole;
