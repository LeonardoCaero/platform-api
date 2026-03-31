import jwt from "jsonwebtoken";
import { env } from "@/config/env";

export interface JwtPayload {
  userId: string;
  email: string;
}

/** Sign a new short-lived access token. */
export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
};

/** Verify and decode an access token. Throws on invalid or expired token. */
export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

/** Decode an access token without verifying the signature. Returns null if malformed. */
export const decodeAccessToken = (token: string): JwtPayload | null => {
  return jwt.decode(token) as JwtPayload | null;
};
