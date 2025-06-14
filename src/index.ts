import dotenv from "dotenv";
dotenv.config();

import express, { Express, Application, Request, Response } from "express";
import cookieParser from "cookie-parser";

import connectDb from "./lib/connectToDb";

import authRouter from "./routes/auth.route"

const app: Application = express();
app.use(cookieParser());
app.use(express.json())
const port = process.env.PORT || 6000;
connectDb();

app.use("/auth",authRouter )

app.get("/", (req: Request, res: Response) => {
  res.send("Backend is working");
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
