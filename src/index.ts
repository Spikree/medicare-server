import dotenv from "dotenv";
dotenv.config();

import express, { Express, Application, Request, Response } from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

import connectDb from "./lib/connectToDb";

import authRouter from "./routes/auth.route"
import doctorRouter from "./routes/doctor.routes"
import patientRouter from "./routes/patient.routes"

const app: Application = express();
app.use(cookieParser());
app.use(express.json())
const port = process.env.PORT || 6000;
app.use(cors({origin: "http://localhost:5173", credentials: true}));
connectDb();

app.use("/auth",authRouter );
app.use("/doctor",doctorRouter);
app.use("/patient", patientRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("Backend is working");
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
