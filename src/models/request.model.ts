import mongoose, { Document, Schema, Model } from "mongoose";

export interface Request extends Document {
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  createdOn: Date;
}

const requestSchema: Schema<Request> = new Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdOn: { type: Date, default: () => new Date() },
});

const User: Model<Request> = mongoose.model<Request>("Request", requestSchema);
export default User;
