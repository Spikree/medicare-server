import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { AES_KEY } from "./cryptoKey"; // 32 bytes

// Returns a single base64 string instead of object with iv/tag/data
export function encryptString(plainText: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", AES_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Pack everything into one Buffer: [iv | tag | data]
  const payload = Buffer.concat([iv, tag, encrypted]);

  // Encode as base64 for portability
  return payload.toString("base64");
}

export function decryptString(encryptedBase64: string): string {
  if (!encryptedBase64) return ""; // nothing to decrypt

  try {
    const payload = Buffer.from(encryptedBase64, "base64");

    // sanity check: payload should be at least 12+16 bytes (iv + tag)
    if (payload.length < 28) {
      // console.warn("Invalid payload length for decryption:", payload.length);
      return encryptedBase64; // return raw if not valid
    }

    // Extract iv (12 bytes), tag (16 bytes), rest is data
    const iv = payload.subarray(0, 12);
    const tag = payload.subarray(12, 28);
    const data = payload.subarray(28);

    const decipher = createDecipheriv("aes-256-gcm", AES_KEY, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (err) {
    // console.error("Decryption failed, returning raw value:", encryptedBase64, err);

    // return default value if the value was not encrypted to decrypt in the first place
    return encryptedBase64; // fallback
  }
}
