import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStripe } from "@/lib/stripe";
import { getSessionUserId } from "@/lib/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { trackEvent } from "@/lib/analytics";

export async function POST(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) {
    return NextResponse.json({ error: "请先登录后再订阅" }, { status: 401 });
  }
  const ip = getClientIp(req);
  const gate = checkRateLimit({
    key: `checkout:${ip}:${uid}`,
    max: 8,
    windowMs: 60_000,
  });
  if (!gate.ok) {
    return NextResponse.json(
      { error: `请求过于频繁，请 ${gate.retryAfterSec} 秒后再试` },
      { status: 429 },
    );
  }
  const priceId = process.env.STRIPE_PRICE_PRO;
  if (!priceId || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "当前服务器未完成 Stripe 计费配置" }, { status: 503 });
  }
  const stripe = requireStripe();
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

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

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancel`,
    metadata: { userId: user.id },
    subscription_data: {
      metadata: { userId: user.id },
    },
  });

  if (!session.url) {
    return NextResponse.json({ error: "创建支付会话失败，请稍后重试" }, { status: 500 });
  }
  await trackEvent({ event: "checkout_started", userId: user.id, path: "/pricing" });
  return NextResponse.json({ url: session.url });
}
