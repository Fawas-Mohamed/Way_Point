import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

// @types/jsonwebtoken types `expiresIn` as a template-literal union
// ("15m", "30d", ...) rather than plain `string`, so a value sourced from
// an env var (validated by Zod as a non-empty string, not that literal
// union) needs an explicit cast at this one boundary.
const accessTokenTtl = env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"];
const refreshTokenTtl = `${env.REFRESH_TOKEN_TTL_DAYS}d` as SignOptions["expiresIn"];

export interface AccessTokenPayload {
  sub: string; // user id
  roleId: string;
  roleName: string;
}

export interface RefreshTokenPayload {
  sub: string; // user id
  sessionId: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: accessTokenTtl,
    issuer: "waypoint-api",
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: "waypoint-api",
  }) as AccessTokenPayload;
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: refreshTokenTtl,
    issuer: "waypoint-api",
  });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: "waypoint-api",
  }) as RefreshTokenPayload;
}
