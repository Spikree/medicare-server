import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { generateToken } from "../lib/utils";
import User, { User as UserType } from "../models/user.model";

export const register = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      message: "Invalid request body",
    });
  }

  const { name, email, password, role } = req.body;

  if (!email || !name || !password || !role) {
    return res.status(400).json({
      message: "Please provide all the required fields",
    });
  }

  if (!["doctor", "patient"].includes(role)) {
    return res.status(400).json({
      message: "Role must be either doctor or patient",
    });
  }

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser =
      (new User({
        name,
        email,
        password: hashedPassword,
        role,
      }) as UserType) || null;

    if (newUser) {
      await newUser.save();

      const newUserObj = newUser.toObject();
      delete newUserObj.password;

      const tokenPayload = {
        _id: newUserObj._id,
        role: newUserObj.role,
      };

      generateToken(tokenPayload, res);

      return res.json({
        user: newUserObj,
        message: "Registration sucessfull",
      });
    } else {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }
  } catch (error: any) {
    console.log(
      "error in register controller in auth controller",
      error.message
    );
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const login = async (req: Request, res: Response): Promise<Response> => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      message: "Invalid request body",
    });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Invalid credentials",
    });
  }

  try {
    const user = (await User.findOne({ email })) as UserType;

    if (!user) {
      return res.status(404).json({
        message: "User with this email not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }
    const UserObj = user.toObject();
    delete UserObj.password;

    const tokenPayload = {
      _id: UserObj._id,
      role: UserObj.role,
    };

    generateToken(tokenPayload, res);

    return res.status(200).json({
      message: "Logged in sucessfully",
      user: UserObj,
    });
  } catch (error: any) {
    console.log("error in login controller in auth controller", error.message);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
