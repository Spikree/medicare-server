import mongoose, { Document, Schema, Model } from "mongoose";

export interface PatientReviews extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  patientDetail: mongoose.Types.ObjectId;
  patientReview: string;
  sideEffects: string;
  reviewBy: string;
  createdOn: Date;
}

const PatientReviewSchema: Schema<PatientReviews> = new Schema({
  name: { type: String, required: true },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  patientDetail: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PatientDetail",
    required: true,
  },
  patientReview: { type: String, required: true },
  sideEffects: { type: String },
  reviewBy: { type: String, required: true, enum: ["doctor", "patient"] },
  createdOn: { type: Date, default: () => new Date() },
});

const PatientReview: Model<PatientReviews> = mongoose.model<PatientReviews>(
  "PatientReview",
  PatientReviewSchema
);
export default PatientReview;
