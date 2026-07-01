import jwt from "jsonwebtoken";
import crypto from "crypto";

function getSecret(): string {
  const secret = process.env["SESSION_SECRET"];
  if (!secret) throw new Error("SESSION_SECRET environment variable is required");
  return secret;
}

export interface JwtPayload {
  sub: number;
  iat?: number;
  exp?: number;
}

const EXPIRES_IN = process.env["JWT_EXPIRES_IN"] ?? "7d";

export function signToken(userId: number): string {
  return jwt.sign({ sub: userId }, getSecret(), {
    algorithm: "HS256",
    expiresIn: EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getSecret(), { algorithms: ["HS256"] }) as unknown as JwtPayload;
}

export function hashOtp(otp: string): string {
  return crypto.createHmac("sha256", getSecret()).update(otp).digest("hex");
}

export function verifyOtp(plainOtp: string, storedHash: string): boolean {
  const expected = hashOtp(plainOtp);
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(storedHash, "hex"));
}
