import { Response } from "express";

import jwt from "jsonwebtoken";

interface TokenPayload {
  _id: string;
  role:"doctor"|"patient"
}

export const generateToken = (user: TokenPayload, res: Response) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }
  const token = jwt.sign({ user }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });

  return token;
};