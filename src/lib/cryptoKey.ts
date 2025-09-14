import { Buffer } from "node:buffer";

export const AES_KEY = Buffer.from(process.env.AES_KEY!, "hex")