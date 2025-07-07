import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { generateToken } from "../lib/utils";
import User, { User as UserType } from "../models/user.model";

export const register = async (req: Request, res: Response): Promise<void> => {
  if (!req.body || typeof req.body !== "object") {
    res.status(400).json({
      message: "Invalid request body",
    });
    return;
  }

  const { name, email, password, role } = req.body;

  if (!email || !name || !password || !role) {
    res.status(400).json({
      message: "Please provide all the required fields",
    });
    return;
  }

  if (!["doctor", "patient"].includes(role)) {
    res.status(400).json({
      message: "Role must be either doctor or patient",
    });
    return;
  }

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(400).json({
        message: "User with this email already exists",
      });
      return;
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

      res.json({
        user: newUserObj,
        message: "Registration sucessfull",
      });
      return;
    } else {
      res.status(400).json({
        message: "Invalid credentials",
      });
      return;
    }
  } catch (error: any) {
    console.log(
      "error in register controller in auth controller",
      error.message
    );
    res.status(500).json({
      message: "Internal Server Error",
    });
    return;
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  if (!req.body || typeof req.body !== "object") {
    res.status(400).json({
      message: "Invalid request body",
    });
    return;
  }

  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      message: "Invalid credentials",
    });
    return;
  }

  try {
    const user = (await User.findOne({ email })) as UserType;

    if (!user) {
      res.status(404).json({
        message: "User with this email not found",
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(400).json({
        message: "Invalid credentials",
      });
      return;
    }
    const UserObj = user.toObject();
    delete UserObj.password;

    const tokenPayload = {
      _id: UserObj._id,
      role: UserObj.role,
    };

    generateToken(tokenPayload, res);

    res.status(200).json({
      message: "Logged in sucessfully",
      user: UserObj,
    });
  } catch (error: any) {
    console.log("error in login controller in auth controller", error.message);
    res.status(500).json({
      message: "Internal Server Error",
    });
    return;
  }
};

export const logout = async (req: Request, res: Response) : Promise<void> => {
  try {
    res.cookie("token", "", {
      maxAge: 0,
      httpOnly: true,
      sameSite: "none",
      secure: true
    });

    res.status(200).json({
      message: "Logged out sucessfully"
    });
  } catch (error) {
    console.log("Error in logout controller");
    res.status(500).json({
      message: "Internal server error"
    });
    return;
  }
}

export const checkAuth = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;

  try {
    res.status(200).json(user);
  } catch (error) {
    console.log("Error In auth controller at check auth", error);
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};
