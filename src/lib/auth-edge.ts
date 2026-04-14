import { jwtVerify } from "jose";

export const SESSION_COOKIE = "lumina_session";

export function getJwtSecretBytes() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    return null;
  }
  return new TextEncoder().encode(s);
}

export async function verifyUserIdFromToken(token: string): Promise<string | null> {
  const secret = getJwtSecretBytes();
  if (!secret) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, secret);
    const sub = payload.sub;
    return typeof sub === "string" ? sub : null;
  } catch {
    return null;
  }
}
