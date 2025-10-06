import { Request, Response } from "express";
import UserModel from "../models/user.model";
import fs from "fs";
import { getCloudinaryPublicId } from "../lib/utils";
import cloudinary from "../lib/cloudinary";
import AllergiesAndGeneralHealthInfo from "../models/allergiesandhealthinfo.model";
import redisClient from "../lib/redisClient";

const defaultRedisExpiry: number = 3600;

export const editProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.body || typeof req.body !== "object") {
    res.status(400).json({
      message: "Invalid request body",
    });
    return;
  }

  const currentUser = req.user;
  const { bio } = req.body;

  try {
    const user = await UserModel.findById(currentUser?._id);

    if (!user) {
      res.status(400).json({
        message: "No user found",
      });
      return;
    }

    let fileLink: string | undefined;

    if (req.file?.path) {
      if (user.profilePicture) {
        const publicId = getCloudinaryPublicId(user.profilePicture);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }

      const cloudinaryResult = await cloudinary.uploader.upload(
        req.file.path!,
        {
          folder: "profile-picture",
        }
      );
      fs.unlinkSync(req.file.path);
      fileLink = cloudinaryResult.secure_url;
    }

    if (bio) user.bio = bio;
    if (fileLink) user.profilePicture = fileLink;

    await user.save();

    res.status(200).json({
      message: "User profile updated",
      user,
    });
  } catch (error) {
    console.log("error in common controller at edit user profile", error);
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  const { id: userId } = req.params;

  try {
    const user = await UserModel.findById(userId).select("-password").lean();

    if (!user) {
      res.status(404).json({
        message: "No user found",
      });
      return;
    }

    res.status(200).json({
      message: "user fetched",
      user,
    });
  } catch (error) {
    console.log("error in common controller at get user profile", error);
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};

export const getAllergiesAndHealthInfo = async (
  req: Request,
  res: Response
) => {
  const { patientId } = req.params;

  const cachekey = `getAllergiesAndHealthInfo:${patientId}`;
  // TODO : delete this from anywhere that makes changes to the data

  try {
    const cachedAllergiesAndHealthInfo = await redisClient.get(cachekey);

    if (cachedAllergiesAndHealthInfo) {
      res.status(200).json({
        message: "Fetched allergies and health info sucessfully ( from cache )",
        allergiesAndHealthInfo: JSON.parse(cachedAllergiesAndHealthInfo),
      });
      return;
    }

    const allergiesAndHealthInfo = await AllergiesAndGeneralHealthInfo.findOne({
      patient: patientId,
    });
    // TODO : Decrypt this data before sending

    if (!allergiesAndHealthInfo) {
      res.status(404).json({
        message: "No allergies and health info found for this patient",
      });
      return;
    }

    redisClient.setEx(
      cachekey,
      defaultRedisExpiry,
      JSON.stringify(allergiesAndHealthInfo)
    );

    res.status(200).json({
      message: "Fetched allergies and health info sucessfully ( from db )",
      allergiesAndHealthInfo,
    });
  } catch (error) {
    console.log(
      "error in common controller at get allergies and health info",
      error
    );
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};
