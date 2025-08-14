"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const checkDoctorRole = (req, res, next) => {
    const user = req.user;
    if ((user === null || user === void 0 ? void 0 : user.role) !== "doctor") {
        res.status(403).json({ message: "Access denied, doctors only" });
        return;
    }
    next();
};
exports.default = checkDoctorRole;
