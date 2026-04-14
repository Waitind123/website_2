import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStripe } from "@/lib/stripe";
import { getSessionUserId } from "@/lib/session";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const ip = getClientIp(req);
  const gate = checkRateLimit({
    key: `portal:${ip}:${uid}`,
    max: 20,
    windowMs: 60_000,
  });
  if (!gate.ok) {
    return NextResponse.json(
      { error: `请求过于频繁，请 ${gate.retryAfterSec} 秒后重试` },
      { status: 429 },
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe 未配置" }, { status: 503 });
  }
  const stripe = requireStripe();
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/dashboard`,
  });
  return NextResponse.json({ url: session.url });
}
