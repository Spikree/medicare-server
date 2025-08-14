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
exports.assignDoctor = exports.removeDoctor = exports.getAllPatientInfo = exports.getLabResultsByDoctor = exports.getPatientReview = exports.getDoctorDetails = exports.searchDoctors = exports.acceptAddRequest = exports.getAllAddRequests = exports.addDoctorRequest = exports.addPatientReview = exports.getPatientDetails = exports.getLabResults = exports.addAllergiesAndHealthinfo = exports.uploadLabResults = exports.getDoctorList = void 0;
const patientlist_model_1 = __importDefault(require("../models/patientlist.model"));
const labresults_model_1 = __importDefault(require("../models/labresults.model"));
const cloudinary_1 = __importDefault(require("../lib/cloudinary"));
const fs_1 = __importDefault(require("fs"));
const allergiesandhealthinfo_model_1 = __importDefault(require("../models/allergiesandhealthinfo.model"));
const patientdetails_model_1 = __importDefault(require("../models/patientdetails.model"));
const patientreview_model_1 = __importDefault(require("../models/patientreview.model"));
const request_model_1 = __importDefault(require("../models/request.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const getDoctorList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const currentUser = req.user;
    try {
        const doctors = yield patientlist_model_1.default.find({
            patient: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
        }).populate("doctor", "name email");
        if (!doctors) {
            res.status(404).json({
                message: "Doctors for this patient does not exist",
            });
            return;
        }
        res.status(200).json({
            message: "Fetched doctors list sucessfully",
            doctors,
        });
    }
    catch (error) {
        console.log("error in patient controller at get doctor list Review", error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
});
exports.getDoctorList = getDoctorList;
const uploadLabResults = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    if (!req.body || typeof req.body !== "object") {
        res.status(400).json({
            message: "Invalid request body",
        });
        return;
    }
    const { title } = req.body;
    const currentUser = req.user;
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
            patient: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
            addedBy: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
        });
        yield newPatientLabResult.save();
        res.status(200).json({
            message: "Patient lab result uploaded sucessfully",
            newPatientLabResult,
        });
    }
    catch (error) {
        console.log("error in patient controller at upload lab results", error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
});
exports.uploadLabResults = uploadLabResults;
const addAllergiesAndHealthinfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.body || typeof req.body !== "object") {
        res.status(400).json({
            message: "Invalid request body",
        });
        return;
    }
    const currentUser = req.user;
    const { allergies, generalHealthInfo } = req.body;
    if (!allergies && !generalHealthInfo) {
        res.status(400).json({
            message: "please fill in the allergies or health info",
        });
        return;
    }
    try {
        const allergiesAndGeneralHealthInfo = new allergiesandhealthinfo_model_1.default({
            patient: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
            allergies: allergies,
            generalHealthInfo: generalHealthInfo,
        });
        yield allergiesAndGeneralHealthInfo.save();
        res.status(200).json({
            message: "saved allergies and general health info",
            allergiesAndGeneralHealthInfo,
        });
    }
    catch (error) {
        console.log("error in patient controller at upload Allergies And Health info", error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
});
exports.addAllergiesAndHealthinfo = addAllergiesAndHealthinfo;
const getLabResults = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const currentUser = req.user;
    try {
        const patientLabResults = yield labresults_model_1.default.find({
            patient: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
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
        console.log("error in patient controller at get lab results", error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
});
exports.getLabResults = getLabResults;
const getPatientDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const currentUser = req.user;
    try {
        const patientDetails = yield patientdetails_model_1.default.find({
            patient: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
        });
        if (!patientDetails) {
            res.status(404).json({
                message: "No details on this patient found",
            });
            return;
        }
        res.status(200).json({
            message: "Patient details fetched sucessfully",
            patientDetails,
        });
    }
    catch (error) {
        console.log("error in patient controller at get patient details", error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
});
exports.getPatientDetails = getPatientDetails;
const addPatientReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { patientDetailId } = req.params;
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
            patientDetail: patientDetailId,
            patientReview: patientReview,
            sideEffects: sideEffects,
            reviewBy: reviewBy,
        });
        yield newPatientReview.save();
        res.status(200).json({
            message: "Added new patient review",
            newPatientReview,
        });
    }
    catch (error) {
        console.log("error in patient controller at add Patient Review", error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
});
exports.addPatientReview = addPatientReview;
const addDoctorRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { doctorId } = req.params;
    const currentUser = req.user;
    if (!doctorId) {
        res.status(400).json({
            message: "Please provide a patient id",
        });
        return;
    }
    try {
        const alreadyInPatientList = yield patientlist_model_1.default.findOne({
            patient: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
            doctor: doctorId,
        });
        if (alreadyInPatientList) {
            res.status(400).json({
                message: "This doctor is already in your doctor list",
            });
            return;
        }
        const existingRequest = yield request_model_1.default.findOne({
            receiver: doctorId,
            sender: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
        });
        const existingRequest2 = yield request_model_1.default.findOne({
            receiver: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
            sender: doctorId,
        });
        if (existingRequest || existingRequest2) {
            res.status(400).json({
                message: "Either this user has sent you a request or you have already sent one request",
            });
            return;
        }
        const newRequest = new request_model_1.default({
            sender: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
            receiver: doctorId,
        });
        newRequest.save();
        res.status(200).json({
            message: "Request sent",
            newRequest,
        });
    }
    catch (error) {
        console.log("error in add doctor request in patient controller" + error);
        res.status(500).json({
            message: "Internal Server Error",
        });
        return;
    }
});
exports.addDoctorRequest = addDoctorRequest;
const getAllAddRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const currentUser = req.user;
    try {
        const requests = yield request_model_1.default.find({
            receiver: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
        })
            .populate("sender", "name email profilePicture")
            .populate("receiver", "name email profilePicture");
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
        console.log("error in get all requests in patient controller" + error);
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
        const doctor = yield user_model_1.default.findById(request === null || request === void 0 ? void 0 : request.sender);
        const newPatient = new patientlist_model_1.default({
            name: currentUser === null || currentUser === void 0 ? void 0 : currentUser.name,
            email: currentUser === null || currentUser === void 0 ? void 0 : currentUser.email,
            bio: currentUser === null || currentUser === void 0 ? void 0 : currentUser.bio,
            doctor: doctor === null || doctor === void 0 ? void 0 : doctor._id,
            patient: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
        });
        yield newPatient.save();
        yield (request === null || request === void 0 ? void 0 : request.deleteOne());
        res.status(200).json({
            message: "New patient added",
            newPatient,
        });
    }
    catch (error) {
        console.log("error in acceptAddRequest in patient controller" + error);
        res.status(500).json({
            message: "Internal Server Error",
        });
        return;
    }
});
exports.acceptAddRequest = acceptAddRequest;
const searchDoctors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.body || typeof req.body !== "object") {
        res.status(400).json({
            message: "Invalid request body",
        });
        return;
    }
    const { doctorName, doctorEmail } = req.body;
    let orCondition = [];
    try {
        if (doctorName) {
            orCondition.push({ name: { $regex: doctorName, $options: "i" } });
        }
        if (doctorEmail) {
            orCondition.push({ email: { $regex: doctorEmail, $options: "i" } });
        }
        const query = orCondition.length > 0
            ? { $and: [{ role: "doctor" }, { $or: orCondition }] }
            : { role: "doctor" };
        const doctors = yield user_model_1.default.find(query).select("-password").lean();
        res.status(200).json({
            doctors,
            message: "fetched patients sucessfully",
        });
    }
    catch (error) {
        console.log("error in patient controller at search doctors", error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
});
exports.searchDoctors = searchDoctors;
const getDoctorDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { doctorId } = req.params;
    if (!doctorId) {
        res.status(400).json({
            message: "doctor id isnt provided",
        });
        return;
    }
    try {
        const doctorDetails = yield patientdetails_model_1.default.find({
            doctor: doctorId,
        }).sort({ createdOn: -1 });
        if (!doctorDetails) {
            res.status(404).json({
                message: "Doctor details not founds",
            });
            return;
        }
        res.status(200).json({
            doctorDetails,
            message: "Doctor details fetched sucessfully",
        });
    }
    catch (error) {
        console.log("error in patient controller at get doctor details", error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
});
exports.getDoctorDetails = getDoctorDetails;
const getPatientReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { patientDetailId } = req.params;
    if (!patientDetailId) {
        res.status(400).json({
            message: "patient detail id is missing",
        });
        return;
    }
    try {
        const patientReviews = yield patientreview_model_1.default.find({
            patientDetail: patientDetailId,
        })
            .populate("doctor", "name email")
            .populate("patient", "name email");
        if (!patientReviews) {
            res.status(404).json({
                message: "Fetched patient reviews",
                patientReviews,
            });
            return;
        }
        res.status(200).json({
            message: "Fetched patient reviews",
            patientReviews,
        });
    }
    catch (error) {
        console.log("error in patient controller at get patient reviews", error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
});
exports.getPatientReview = getPatientReview;
const getLabResultsByDoctor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { doctorId } = req.params;
    const currentUser = req.user;
    if (!doctorId) {
        res.status(400).json({
            message: "doctor id is missing",
        });
        return;
    }
    try {
        const labResultsByDoctor = yield labresults_model_1.default.find({
            addedBy: doctorId,
            patient: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
        });
        if (!labResultsByDoctor) {
            res.status(404).json({
                message: "No lab results by doctor found",
            });
            return;
        }
        res.status(200).json({
            message: "Fetched lab results by doctor sucessfully",
            labResultsByDoctor,
        });
    }
    catch (error) {
        console.log("error in patient controller at get lab results by doctor route", error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
});
exports.getLabResultsByDoctor = getLabResultsByDoctor;
const getAllPatientInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const currentUser = req.user;
    try {
        const userInfo = yield user_model_1.default.findById(currentUser === null || currentUser === void 0 ? void 0 : currentUser._id).select("-password");
        const patientDetails = yield patientdetails_model_1.default.find({
            patient: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
        }).populate("doctor", "name email");
        const allergiesAndHealthInfo = yield allergiesandhealthinfo_model_1.default.find({
            patient: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
        });
        const labResults = yield labresults_model_1.default
            .find({
            patient: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
        })
            .populate("addedBy", "name email");
        const patientReviews = yield patientreview_model_1.default.find({
            patient: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
        }).populate("patientDetail", "Disease symptom medicationPrescribed");
        const doctorList = yield patientlist_model_1.default.find({
            patient: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id,
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
        console.log("error in patient controller at get all patient info", error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
});
exports.getAllPatientInfo = getAllPatientInfo;
const removeDoctor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { doctorId } = req.params;
    const currentUser = req.user;
    if (!doctorId) {
        res.status(400).json({
            message: "Doctor Id is not provided",
        });
        return;
    }
    try {
        yield patientlist_model_1.default.updateOne({ doctor: doctorId, patient: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id }, { $set: { patientStatus: "old" } });
        res.status(200).json({
            message: "Doctor removed",
        });
    }
    catch (error) {
        console.log("error in patient controllers at remove doctor", error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
});
exports.removeDoctor = removeDoctor;
const assignDoctor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { doctorId } = req.params;
    const currentUser = req.user;
    if (!doctorId) {
        res.status(400).json({
            message: "Doctor Id is not provided",
        });
        return;
    }
    try {
        yield patientlist_model_1.default.updateOne({ doctor: doctorId, patient: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id }, { $set: { patientStatus: "current" } });
        res.status(200).json({
            message: "Doctor reassigned",
        });
    }
    catch (error) {
        console.log("error in patient controllers at reassign doctor", error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
});
exports.assignDoctor = assignDoctor;
