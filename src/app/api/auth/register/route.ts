import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { setSessionCookie, signSessionToken } from "@/lib/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { trackEvent } from "@/lib/analytics";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().max(80).optional(),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const gate = checkRateLimit({
    key: `register:${ip}`,
    max: 8,
    windowMs: 60_000,
  });
  if (!gate.ok) {
    return NextResponse.json(
      { error: `请求过于频繁，请 ${gate.retryAfterSec} 秒后再试` },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { email, password, name } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name: name ?? null },
  });
  const token = await signSessionToken(user.id);
  await setSessionCookie(token);
  await trackEvent({ event: "register_success", userId: user.id, path: "/register" });
  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
}
