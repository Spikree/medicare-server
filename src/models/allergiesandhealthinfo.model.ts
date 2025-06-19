import mongoose, { Document, Schema, Model } from "mongoose";

export interface allergiesandhealthinfo extends Document {
  _id: mongoose.Types.ObjectId;
  patient: mongoose.Types.ObjectId;
  allergies: string;
  generalHealthInfo: string;
  createdOn: Date;
}

const allergiesandhealthinfoSchema: Schema<allergiesandhealthinfo> = new Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    allergies: {
      type: String,
      required: false,
    },
    generalHealthInfo: {
      type: String,
      required: false,
    },
    createdOn: { type: Date, default: () => new Date() },
  }
);

const AllergiesAndGeneralHealthInfo: Model<allergiesandhealthinfo> =
  mongoose.model<allergiesandhealthinfo>(
    "AllergiesAndGeneralHealthInfo",
    allergiesandhealthinfoSchema
  );
export default AllergiesAndGeneralHealthInfo;
