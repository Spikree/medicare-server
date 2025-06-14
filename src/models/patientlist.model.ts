import mongoose, {Document, Schema, Model} from "mongoose";

export interface Patientlist extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    bio: string;
    profilePicture: string;
    patient: mongoose.Types.ObjectId;
    doctor: mongoose.Types.ObjectId;
    patientStatus: "current"| "old";
    createdOn: Date;
}

const PatientListSchema : Schema<Patientlist> = new Schema({
    name:{type:String, required: true},
    email: {type: String, required: true},
    bio:{type: String},
    profilePicture: {type:String},
    doctor:{type: mongoose.Schema.Types.ObjectId, ref:'User', required: true},
    patient:{type: mongoose.Schema.Types.ObjectId, ref:'User', required: true},
    patientStatus: {
        type: String,
        required: true,
        enum: ["current","old"]
    },
    createdOn: { type: Date, default: () => new Date() },
});

const PatientList : Model<Patientlist> = mongoose.model<Patientlist>("PatientList", PatientListSchema);
export default PatientList;