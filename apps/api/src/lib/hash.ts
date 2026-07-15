import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

/**
 * Refresh tokens and password-reset tokens are stored server-side as a
 * SHA-256 hash, never in plaintext — if the database were ever exposed,
 * the tokens themselves would not be directly usable.
 */
export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
