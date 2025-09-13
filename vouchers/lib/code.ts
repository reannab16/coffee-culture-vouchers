import crypto from "crypto";
export function shortCode(len = 8) {
  // URL-safe, uppercase
  return crypto.randomBytes(6).toString("base64url").slice(0, len).toUpperCase();
}