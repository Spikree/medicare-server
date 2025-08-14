"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const checkPatientRole = (req, res, next) => {
    const user = req.user;
    if ((user === null || user === void 0 ? void 0 : user.role) !== "patient") {
        res.status(403).json({ message: "Access denied, patients only" });
        return;
    }
    next();
};
exports.default = checkPatientRole;
