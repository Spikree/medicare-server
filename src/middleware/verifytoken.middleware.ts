import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/user.model";
import { Request, Response, NextFunction } from "express";

const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = await req.cookies.token;

    if (!token) {
      res.status(401).json({
        message: "Unauthorized - No Token Provided",
      });

      return;
    }

    if (!process.env.JWT_SECRET) {
      console.log("JWT_SECRET is not defined");
      res.status(400).json({
        message: "Authorisation error",
      });

      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

    if (!decoded) {
      res.status(401).json({
        message: "Unauthorized - Token Is Invalid",
      });

      return;
    }

    const user = await User.findById(decoded?.user?._id).select("-password");

    if (!user) {
      res.status(400).json({
        message: "User not found",
      });

      return;
    }

    req.user = user;

    next();
  } catch (error) {
    console.log("error in verifyToken middleware", error);
    res.status(500).json({
      message: "Invalid User",
    });
  }
};

export default verifyToken;
