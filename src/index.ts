import dotenv from "dotenv";
dotenv.config();

import express, { Express, Application, Request, Response } from "express";
import cookieParser from "cookie-parser";

import connectDb from "./lib/connectToDb";

const app: Application = express();
app.use(cookieParser());
const port = process.env.PORT || 6000;
connectDb();

app.get("/", (req: Request, res: Response) => {
  res.send("Backend is working");
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
