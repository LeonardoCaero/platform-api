import jwt from "jsonwebtoken";
import { env } from "@/config/env";

export interface JwtPayload {
  userId: string;
  email: string;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

export const decodeAccessToken = (token: string): JwtPayload | null => {
  return jwt.decode(token) as JwtPayload | null;
};
