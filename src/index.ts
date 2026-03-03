import cors from "cors";

import dotenv from "dotenv";
dotenv.config();

import express, { Express, Application, Request, Response } from "express";

import cookieParser from "cookie-parser";

import connectDb from "./lib/connectToDb";

import authRouter from "./routes/auth.route";
import doctorRouter from "./routes/doctor.routes";
import patientRouter from "./routes/patient.routes";
import commonRouter from "./routes/common.routes";
import geminiRouter from "./routes/gemini.routes";
import chatRouter from "./routes/chat.route";
import stripeRouter from "./routes/stripe.route";

import { app, server } from "./socket/socket";
import rateLimiter from "./middleware/rateLimiter.middleware";

const port = process.env.PORT || 6000;

app.use(
  cors({
    origin: ["http://localhost:5173", "https://medicare-client.onrender.com"],
    credentials: true,
  }),
);

app.use("/stripe", stripeRouter);

app.use(cookieParser());
app.use(express.json());

connectDb();

app.use("/auth", authRouter);
app.use("/doctor", doctorRouter, rateLimiter);
app.use("/patient", patientRouter);
app.use("/common", commonRouter);
app.use("/gemini", geminiRouter);
app.use("/chatRoute", chatRouter);
// app.use("/stripe", stripeRouter);
app.get("/", (req: Request, res: Response) => {
  res.send("Backend is working");
});

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
