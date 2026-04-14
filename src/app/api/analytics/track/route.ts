import { NextResponse } from "next/server";
import { z } from "zod";
import { trackEvent } from "@/lib/analytics";
import { getSessionUserId } from "@/lib/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  event: z.string().min(1).max(100),
  path: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const gate = checkRateLimit({
    key: `analytics:${ip}`,
    max: 120,
    windowMs: 60_000,
  });
  if (!gate.ok) {
    return NextResponse.json({ ok: true });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const uid = await getSessionUserId();
  await trackEvent({
    event: parsed.data.event,
    path: parsed.data.path,
    userId: uid,
  });
  return NextResponse.json({ ok: true });
}
