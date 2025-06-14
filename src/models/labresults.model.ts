import mongoose, { Document, Schema, Model } from "mongoose";

export interface patientLabResults extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  labResult: string;
  patient: mongoose.Types.ObjectId;
  createdOn: Date;
}

const patientLabResultsSchema: Schema<patientLabResults> = new Schema({
  title: { type: String, required: true },
  labResult: { type: String },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdOn: { type: Date, default: () => new Date() },
});

const patientLabResult: Model<patientLabResults> =
  mongoose.model<patientLabResults>(
    "patientLabResult",
    patientLabResultsSchema
  );
export default patientLabResult;
