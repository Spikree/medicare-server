import mongoose, { Document, Schema, Model } from "mongoose";

export interface chatModel extends Document {
  _id: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  reveiverId: mongoose.Types.ObjectId;
  text: string;
  imageUrl: string;
  chatId: string;
}

const chatSchema: Schema<chatModel> = new Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reveiverId: { type: mongoose.Schema.Types.ObjectId, required: true },
  text: { type: String },
  imageUrl: { type: String },
  chatId: { type: String, required: true },
});

const chatModel: Model<chatModel> = mongoose.model<chatModel>(
  "chatModel",
  chatSchema
);
export default chatModel;
