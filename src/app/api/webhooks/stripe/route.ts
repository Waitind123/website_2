import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { sendBillingMail } from "@/lib/mailer";
import { trackEvent } from "@/lib/analytics";

async function findUserIdByStripeRefs(input: {
  userId?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
}) {
  if (input.userId) {
    return input.userId;
  }

  if (input.subscriptionId) {
    const bySub = await prisma.user.findFirst({
      where: { stripeSubscriptionId: input.subscriptionId },
      select: { id: true },
    });
    if (bySub?.id) {
      return bySub.id;
    }
  }

  if (input.customerId) {
    const byCustomer = await prisma.user.findFirst({
      where: { stripeCustomerId: input.customerId },
      select: { id: true },
    });
    if (byCustomer?.id) {
      return byCustomer.id;
    }
  }

  return null;
}

export async function POST(req: Request) {
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!whSecret || !stripe) {
    return NextResponse.json({ error: "Not configured" }, { status: 501 });
  }

  const body = await req.text();
  const headerList = await headers();
  const sig = headerList.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, whSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const sessionCustomerRaw = session.customer;
    const customerId =
      typeof sessionCustomerRaw === "string" ? sessionCustomerRaw : sessionCustomerRaw?.id ?? null;
    const subRaw = session.subscription;
    const subId = typeof subRaw === "string" ? subRaw : subRaw?.id;
    const userId = await findUserIdByStripeRefs({
      userId: session.metadata?.userId,
      customerId,
      subscriptionId: subId ?? null,
    });
    if (userId && subId) {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          plan: "pro",
          subscriptionStatus: "active",
          stripeSubscriptionId: subId,
          stripeCustomerId: customerId ?? undefined,
        },
      });
      await trackEvent({ event: "subscription_activated", userId, path: "/dashboard" });
      await sendBillingMail({
        to: user.email,
        subject: "Lumina Pro 订阅开通成功",
        html: `<p>你好，${user.name ?? user.email}。</p><p>你的 Pro 订阅已开通成功，感谢支持！</p>`,
      });
    }
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const subCustomerRaw = subscription.customer;
    const customerId =
      typeof subCustomerRaw === "string" ? subCustomerRaw : subCustomerRaw?.id ?? null;
    const subId = subscription.id;
    const userId = await findUserIdByStripeRefs({
      userId: subscription.metadata?.userId,
      customerId,
      subscriptionId: subId,
    });
    if (userId) {
      const status = subscription.status;
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: status,
          plan: status === "active" || status === "trialing" ? "pro" : "free",
          stripeSubscriptionId: subId,
          stripeCustomerId: customerId ?? undefined,
        },
      });
      await trackEvent({ event: "subscription_updated", userId, path: "/dashboard" });
      await sendBillingMail({
        to: user.email,
        subject: `Lumina 订阅状态更新：${status}`,
        html: `<p>你的订阅状态已更新为 <strong>${status}</strong>。</p>`,
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const subCustomerRaw = subscription.customer;
    const customerId =
      typeof subCustomerRaw === "string" ? subCustomerRaw : subCustomerRaw?.id ?? null;
    const subId = subscription.id;
    const userId = await findUserIdByStripeRefs({
      userId: subscription.metadata?.userId,
      customerId,
      subscriptionId: subId,
    });
    if (userId) {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          plan: "free",
          subscriptionStatus: "canceled",
          stripeSubscriptionId: null,
        },
      });
      await trackEvent({ event: "subscription_canceled", userId, path: "/dashboard" });
      await sendBillingMail({
        to: user.email,
        subject: "Lumina Pro 已取消",
        html: "<p>你的 Pro 订阅已取消，如需恢复可随时重新订阅。</p>",
      });
    }
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const customerRaw = invoice.customer;
    const customerId =
      typeof customerRaw === "string" ? customerRaw : customerRaw?.id ?? null;
    const subscriptionRaw = invoice.subscription;
    const subscriptionId =
      typeof subscriptionRaw === "string" ? subscriptionRaw : subscriptionRaw?.id ?? null;
    const userId = await findUserIdByStripeRefs({
      customerId,
      subscriptionId,
    });
    if (userId) {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: "past_due",
          stripeCustomerId: customerId ?? undefined,
          stripeSubscriptionId: subscriptionId ?? undefined,
        },
      });
      await trackEvent({ event: "invoice_payment_failed", userId, path: "/pricing" });
      await sendBillingMail({
        to: user.email,
        subject: "Lumina 订阅扣款失败",
        html: "<p>你的最新一次订阅扣款失败，请前往账单中心更新支付方式。</p>",
      });
    }
  }

  return NextResponse.json({ received: true });
}

export const runtime = "nodejs";
