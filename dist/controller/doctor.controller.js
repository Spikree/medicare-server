"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPatientInfo = exports.acceptAddRequest = exports.getAllAddRequests = exports.addPatientRequest = exports.searchPatients = exports.getPatientLabResults = exports.getPatientDetails = exports.getPatientReview = exports.addPatientReview = exports.addPatientDetails = exports.uploadLabResults = exports.getPatientList = exports.addNewPatient = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const labresults_model_1 = __importDefault(require("../models/labresults.model"));
const cloudinary_1 = __importDefault(require("../lib/cloudinary"));
const patientlist_model_1 = __importDefault(require("../models/patientlist.model"));
const fs_1 = __importDefault(require("fs"));
const patientdetails_model_1 = __importDefault(require("../models/patientdetails.model"));
const patientreview_model_1 = __importDefault(require("../models/patientreview.model"));
const request_model_1 = __importDefault(require("../models/request.model"));
const user_model_2 = __importDefault(require("../models/user.model"));
const allergiesandhealthinfo_model_1 = __importDefault(require("../models/allergiesandhealthinfo.model"));
const addNewPatient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.body || typeof req.body !== "object") {
            res.status(400).json({
                message: "Invalid request body",
            });
            return;
        }
        const currentUser = req.user;
        const { patientId } = req.body;
        if (!patientId) {
            res.status(400).json({
                message: "Please provide a patient id",
            });
            return;
        }
        const patient = (yield user_model_1.default.findById(patientId));
        if (!patient) {
            res.status(404).json({
                message: "Patient not found",
            });
            return;
        }
        const isPatientAlreadyInList = yield patientlist_model_1.default.findOne({
            email: patient === null || patient === void 0 ? void 0 : patient.email,
            doctor: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
        });
        if (isPatientAlreadyInList) {
            res.status(400).json({
                message: "You already have this patient in your patient list",
            });
            return;
        }
        const newPatient = new patientlist_model_1.default({
            name: patient === null || patient === void 0 ? void 0 : patient.name,
            email: patient === null || patient === void 0 ? void 0 : patient.email,
            bio: patient === null || patient === void 0 ? void 0 : patient.bio,
            profilePicture: patient === null || patient === void 0 ? void 0 : patient.profilePicture,
            patient: patient === null || patient === void 0 ? void 0 : patient._id,
            doctor: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
            patientStatus: "current",
        });
        yield newPatient.save();
        res.status(200).json({
            message: "New patient added sucessfully",
            newPatient,
        });
    }
    catch (error) {
        console.log("error in doctor controller at add new patient", error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
});
exports.addNewPatient = addNewPatient;
const getPatientList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUser = req.user;
        const patientList = yield patientlist_model_1.default.find({ doctor: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id });
        if (!patientList) {
            res.status(404).json({
                message: "Patient list not found",
            });
            return;
        }
        res.status(200).json({
            message: "Patient list fetched sucessfully",
            patientList,
        });
    }
    catch (error) {
        console.log("error in doctor controller at get patient list", error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
});
exports.getPatientList = getPatientList;
const uploadLabResults = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    if (!req.body || typeof req.body !== "object") {
        res.status(400).json({
            message: "Invalid request body",
        });
        return;
    }
    const { title } = req.body;
    const { patientId } = req.params;
    const currentUser = req.user;
    if (!patientId) {
        res.status(400).json({
            message: "Please provide a patient id",
        });
        return;
    }
    if (!req.file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
    }
    try {
        const cloudinaryResult = yield cloudinary_1.default.uploader.upload((_a = req.file) === null || _a === void 0 ? void 0 : _a.path, {
            folder: "lab-results",
        });
        if ((_b = req.file) === null || _b === void 0 ? void 0 : _b.path) {
            fs_1.default.unlinkSync((_c = req.file) === null || _c === void 0 ? void 0 : _c.path);
        }
        const fileLink = cloudinaryResult.secure_url;
        const newPatientLabResult = new labresults_model_1.default({
            title: title,
            labResult: fileLink,
            patient: patientId,
            addedBy: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
        });
        yield newPatientLabResult.save();
        res.status(200).json({
            message: "Patient lab result uploaded sucessfully",
            newPatientLabResult,
        });
    }
    catch (error) {
        console.log("error in doctor controller at upload lab results", error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
});
exports.uploadLabResults = uploadLabResults;
const addPatientDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.body || typeof req.body !== "object") {
        res.status(400).json({
            message: "Invalid request body",
        });
        return;
    }
    const { Disease, symptom, patientExperience, medicationPrescribed } = req.body;
    const { patientId } = req.params;
    const currentUser = req.user;
    if (!Disease || !symptom || !patientExperience || !medicationPrescribed) {
        res.status(400).json({
            message: "Please fill in the required fields",
        });
        return;
    }
    if (!patientId) {
        res.status(400).json({
            message: "please provide a patient id",
        });
        return;
    }
    try {
        const patient = yield user_model_1.default.findById(patientId);
        if (!patient) {
            res.status(404).json({
                message: "No patient with this id",
            });
        }
        const patientDetail = new patientdetails_model_1.default({
            name: patient === null || patient === void 0 ? void 0 : patient.name,
            patient: patientId,
            doctor: currentUser === null || currentUser === void 0 ? void 0 : currentUser.id,
            Disease: Disease,
            symptom: symptom,
            patientExperience: patientExperience,
            medicationPrescribed: medicationPrescribed,
        });
        yield patientDetail.save();
        res.status(200).json({
            message: "Patient details added sucessfully",
            patientDetail,
        });
    }
    catch (error) {
        console.log("error in doctor controller at add patient details", error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
});
exports.addPatientDetails = addPatientDetails;
const addPatientReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { patientDetailId } = req.params;
    const currentUser = req.user;
    if (!req.body || typeof req.body !== "object") {
        res.status(400).json({
            message: "Invalid request body",
        });
        return;
    }
    const { patientReview, sideEffects, reviewBy } = req.body;
    if (!patientDetailId) {
        res.status(400).json({
            message: "Please provide patient details id",
        });
        return;
    }
    try {
        const patientDetails = yield patientdetails_model_1.default.findById(patientDetailId);
        const newPatientReview = new patientreview_model_1.default({
            name: patientDetails === null || patientDetails === void 0 ? void 0 : patientDetails.name,
            patient: patientDetails === null || patientDetails === void 0 ? void 0 : patientDetails.patient,
            doctor: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
            patientDetail: patientDetailId,
            patientReview: patientReview,
            reviewBy: reviewBy,
            sideEffects: sideEffects,
        });
        yield newPatientReview.save();
        res.status(200).json({
            message: "Added new patient review",
            newPatientReview,
        });
    }
    catch (error) {
        console.log("error in doctor controller at add Patient Review", error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
});
exports.addPatientReview = addPatientReview;
const getPatientReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { patientDetailId } = req.params;
    if (!patientDetailId) {
        res.status(400).json({
            message: "Please provide patient details id",
        });
        return;
    }
    try {
        const patientReview = yield patientreview_model_1.default.find({
            patientDetail: patientDetailId,
        })
            .populate("doctor", "name email")
            .populate("patient", "name email");
        if (!patientReview) {
            res.status(404).json({
                message: "No review found",
            });
            return;
        }
        res.status(200).json({
            message: "Fetched all patient reviews sucessfully",
            patientReview,
        });
    }
    catch (error) {
        console.log("error in doctor controller at get patient reviews", error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
});
exports.getPatientReview = getPatientReview;
const getPatientDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { patientId } = req.params;
    if (!patientId) {
        res.status(400).json({
            message: "Please provide a patient id",
        });
        return;
    }
    try {
        const patientDetails = yield patientdetails_model_1.default.find({
            patient: patientId,
        }).sort({ createdOn: -1 });
        if (!patientDetails) {
            res.status(404).json({
                message: "No patient details found",
            });
            return;
        }
        res.status(200).json({
            message: "Fetched patient details sucessfully",
            patientDetails,
        });
    }
    catch (error) {
        console.log("error in doctor controller at get patient details", error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
});
exports.getPatientDetails = getPatientDetails;
const getPatientLabResults = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { patientId } = req.params;
    if (!patientId) {
        res.status(400).json({
            message: "Please provide a patient id",
        });
        return;
    }
    try {
        const patientLabResults = yield labresults_model_1.default.find({
            patient: patientId,
        });
        if (!patientLabResults) {
            res.status(404).json({
                message: "Patient lab results not found",
            });
            return;
        }
        res.status(200).json({
            message: "Fetched patient lab results sucessfully",
            patientLabResults,
        });
    }
    catch (error) {
        console.log("error in doctor controller at get patient lab results", error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
});
exports.getPatientLabResults = getPatientLabResults;
const searchPatients = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.body || typeof req.body !== "object") {
        res.status(400).json({
            message: "Invalid request body",
        });
        return;
    }
    const { patientName, patientEmail } = req.body;
    let orCondition = [];
    try {
        if (patientName) {
            orCondition.push({ name: { $regex: patientName, $options: "i" } });
        }
        if (patientEmail) {
            orCondition.push({ email: { $regex: patientEmail, $options: "i" } });
        }
        const query = orCondition.length > 0
            ? { $and: [{ role: "patient" }, { $or: orCondition }] }
            : { role: "patient" };
        const patients = yield user_model_1.default.find(query).select("-password").lean();
        res.status(200).json({
            patients,
            message: "fetched patients sucessfully",
        });
    }
    catch (error) {
        console.log("error in doctor controller at search patients lab results", error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
});
exports.searchPatients = searchPatients;
const addPatientRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { patientId } = req.params;
    const currentUser = req.user;
    if (!patientId) {
        res.status(400).json({
            message: "Please provide a patient id",
        });
        return;
    }
    try {
        const alreadyInPatientList = yield patientlist_model_1.default.findOne({
            patient: patientId,
            doctor: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
        });
        if (alreadyInPatientList) {
            res.status(400).json({
                message: "This patient is already in your patient list",
            });
            return;
        }
        const existingRequest = yield request_model_1.default.findOne({
            receiver: patientId,
            sender: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
        });
        const existingRequest2 = yield request_model_1.default.findOne({
            receiver: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
            sender: patientId,
        });
        if (existingRequest || existingRequest2) {
            res.status(400).json({
                message: "Either this user has sent you a request or you have already sent one request",
            });
            return;
        }
        const newRequest = new request_model_1.default({
            sender: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
            receiver: patientId,
        });
        newRequest.save();
        res.status(200).json({
            message: "Request sent",
            newRequest,
        });
    }
    catch (error) {
        console.log("error in add patient request in doctor controller" + error);
        res.status(500).json({
            message: "Internal Server Error",
        });
        return;
    }
});
exports.addPatientRequest = addPatientRequest;
const getAllAddRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const currentUser = req.user;
    try {
        const requests = yield request_model_1.default.find({
            receiver: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
        })
            .populate("receiver", "name email profilePicture")
            .populate("sender", "name email profilePicture");
        if (!requests) {
            res.status(404).json({
                message: "No requests found",
            });
            return;
        }
        res.status(200).json({
            message: "Fetched all the requests",
            requests,
        });
    }
    catch (error) {
        console.log("error in get all requests in doctor controller" + error);
        res.status(500).json({
            message: "Internal Server Error",
        });
        return;
    }
});
exports.getAllAddRequests = getAllAddRequests;
const acceptAddRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { requestId } = req.params;
    const currentUser = req.user;
    if (!requestId) {
        res.status(400).json({
            message: "please provide a request id",
        });
        return;
    }
    try {
        const request = yield request_model_1.default.findOne({
            _id: requestId,
        });
        const patient = yield user_model_2.default.findById(request === null || request === void 0 ? void 0 : request.sender);
        const newPatient = new patientlist_model_1.default({
            name: patient === null || patient === void 0 ? void 0 : patient.name,
            email: patient === null || patient === void 0 ? void 0 : patient.email,
            bio: patient === null || patient === void 0 ? void 0 : patient.bio,
            doctor: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
            patient: patient === null || patient === void 0 ? void 0 : patient._id,
        });
        yield newPatient.save();
        yield (request === null || request === void 0 ? void 0 : request.deleteOne());
        res.status(200).json({
            message: "Patient added sucessfully",
            newPatient,
        });
    }
    catch (error) {
        console.log("error in acceptAddRequest in doctor controller" + error);
        res.status(500).json({
            message: "Internal Server Error",
        });
        return;
    }
});
exports.acceptAddRequest = acceptAddRequest;
const getAllPatientInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { patientId } = req.params;
    try {
        const userInfo = yield user_model_2.default.findById(patientId).select("-password");
        const patientDetails = yield patientdetails_model_1.default.find({
            patient: patientId,
        }).populate("doctor", "name email");
        const allergiesAndHealthInfo = yield allergiesandhealthinfo_model_1.default.find({
            patient: patientId,
        });
        const labResults = yield labresults_model_1.default
            .find({
            patient: patientId,
        })
            .populate("addedBy", "name email");
        const patientReviews = yield patientreview_model_1.default.find({
            patient: patientId,
        }).populate("patientDetail", "Disease symptom medicationPrescribed");
        const doctorList = yield patientlist_model_1.default.find({
            patient: patientId,
        }).populate("doctor", "name email bio");
        const allPatientInfo = {
            userInfo,
            patientDetails,
            allergiesAndHealthInfo,
            labResults,
            patientReviews,
            doctorList,
            summary: {
                totalMedicalRecords: patientDetails.length,
                totalLabResults: labResults.length,
                totalReviews: patientReviews.length,
                totalDoctors: doctorList.length,
            },
        };
        res.status(200).json({
            message: "All patient information fetched successfully",
            allPatientInfo,
        });
    }
    catch (error) {
        console.log("error in doctor controller at get all patient info", error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
});
exports.getAllPatientInfo = getAllPatientInfo;
// The aiSummary and askPatientQuestion functions have been moved to gemini.controller.ts for AI chat and summary features.
