import { Request, Response } from "express";
import UserModel from "../models/user.model";
import fs from "fs";
import { getCloudinaryPublicId } from "../lib/utils";
import cloudinary from "../lib/cloudinary";

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
