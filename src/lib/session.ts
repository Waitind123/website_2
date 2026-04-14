import { SignJWT } from "jose";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  getJwtSecretBytes,
  verifyUserIdFromToken,
} from "./auth-edge";

export async function signSessionToken(userId: string) {
  const secret = getJwtSecretBytes();
  if (!secret) {
    throw new Error("SESSION_SECRET must be set to a string of at least 32 characters");
  }
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUserId() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return verifyUserIdFromToken(token);
}
