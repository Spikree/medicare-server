import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { AES_KEY } from "./cryptoKey";

type EncryptedPayload = { iv: string; tag: string; data: string };

export function encrypt(text: string): EncryptedPayload {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", AES_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
    data: encrypted.toString("hex"),
  };
}

export function decrypt(payload: EncryptedPayload): string {
  const decipher = createDecipheriv("aes-256-gcm", AES_KEY, Buffer.from(payload.iv, "hex"));
  decipher.setAuthTag(Buffer.from(payload.tag, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(payload.data, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}
