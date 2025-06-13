import mongoose from "mongoose";

const connectDb = async () => {
  if (!process.env.MONGO_CONNECT_STRING) {
    throw new Error("MONGO_CONNECT_STRING is not defined");
  }
  try {
    await mongoose.connect(process.env.MONGO_CONNECT_STRING as string);
    console.log("connected to mongodb");
  } catch (error) {
    console.log("couldnt connect to mongoDB", error);
  }
};

export default connectDb;
