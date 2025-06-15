import mongoose, { Document, Schema, Model } from "mongoose";

export interface PatientDetails extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  Disease: string;
  symptom: string;
  patientExperience : string;
  medicationPrescribed: string;
  createdOn: Date;
}

const PatientDetailsSchema: Schema<PatientDetails> = new Schema({
  name: { type: String, required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  Disease: { type: String, required: true },
  symptom: { type: String, required: true },
  patientExperience: { type: String, required: true },
  medicationPrescribed: { type: String, required: true },
  createdOn: { type: Date, default: () => new Date() },
});

const PatientDetail: Model<PatientDetails> = mongoose.model<PatientDetails>(
  "PatientDetail",
  PatientDetailsSchema
);
export default PatientDetail;
