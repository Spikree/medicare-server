import mongoose, {Document, Schema} from "mongoose";
import { Part } from "@google/generative-ai";

export interface IHistory extends Document {
    role: "user" | "model";
    parts: Part[];
}

export interface IAiChatHistory extends Document {
    patientId: mongoose.Schema.Types.ObjectId,
    history: IHistory[];
    createdAt: Date;
    updatedAt: Date;
}

const AiChatHistorySchema : Schema<IAiChatHistory> = new Schema({
    patientId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true},
    history: [
        {
            role: {type: String, enum: ["user", "model"], required: true},
            parts: [{text: {type: String, required: true}}]
        }
    ]
}, {
    timestamps: true
});

const AiChatHistory = mongoose.model<IAiChatHistory>("AiChatHistory", AiChatHistorySchema);
export default AiChatHistory