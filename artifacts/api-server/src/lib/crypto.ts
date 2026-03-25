import { createHash, randomBytes } from "crypto";

export function generateToken(length = 32): string {
  return randomBytes(length).toString("hex");
}

export function generateSessionCode(): string {
  const code = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
  return code;
}

export function hashData(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}
