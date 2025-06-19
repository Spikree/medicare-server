import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model";

const checkPatientRole = (
  req: Request & { user?: User },
  res: Response,
  next: NextFunction
): void => {
  const user = req.user;

  if (user?.role !== "patient") {
    res.status(403).json({ message: "Access denied, patients only" });
    return;
  }
  next();
};

export default checkPatientRole;
