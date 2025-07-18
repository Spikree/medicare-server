import mongoose, { Document, Schema, Model } from "mongoose";

export interface Request extends Document {
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  createdOn: Date;
}

const requestSchema: Schema<Request> = new Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdOn: { type: Date, default: () => new Date() },
});

const Request: Model<Request> = mongoose.model<Request>("Request", requestSchema);
export default Request;
