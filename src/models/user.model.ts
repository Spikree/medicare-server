import mongoose, { Document, Schema, Model } from "mongoose";

export interface User extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: "doctor" | "patient";
  bio: string;
  profilePicture: string;
  doctorId: string;
  createdOn: Date;
}

const userSchema: Schema<User> = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: ["doctor", "patient"],
  },
  bio: { type: String },
  profilePicture: { type: String },
  doctorId: { type: String },
  createdOn: { type: Date, default: () => new Date() },
});

const User: Model<User> = mongoose.model<User>("User", userSchema);
export default User;
