"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const connectToDb_1 = __importDefault(require("./lib/connectToDb"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const doctor_routes_1 = __importDefault(require("./routes/doctor.routes"));
const patient_routes_1 = __importDefault(require("./routes/patient.routes"));
const common_routes_1 = __importDefault(require("./routes/common.routes"));
const gemini_routes_1 = __importDefault(require("./routes/gemini.routes"));
const app = (0, express_1.default)();
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
const port = process.env.PORT || 6000;
app.use((0, cors_1.default)({ origin: "http://localhost:5173", credentials: true }));
(0, connectToDb_1.default)();
// main();
app.use("/auth", auth_route_1.default);
app.use("/doctor", doctor_routes_1.default);
app.use("/patient", patient_routes_1.default);
app.use("/common", common_routes_1.default);
app.use("/gemini", gemini_routes_1.default);
app.get("/", (req, res) => {
    res.send("Backend is working");
});
app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
