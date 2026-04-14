import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { setSessionCookie, signSessionToken } from "@/lib/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { trackEvent } from "@/lib/analytics";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const gate = checkRateLimit({
    key: `login:${ip}`,
    max: 10,
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
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  const token = await signSessionToken(user.id);
  await setSessionCookie(token);
  await trackEvent({ event: "login_success", userId: user.id, path: "/login" });
  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
}
