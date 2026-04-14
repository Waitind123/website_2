import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { stripe } from "@/lib/stripe";
import styles from "@/app/inner.module.css";
import { BillingPortalButton } from "@/components/billing-portal-button";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const uid = await getSessionUserId();
  if (!uid) {
    redirect("/login");
  }
  let user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) {
    redirect("/login");
  }
  let nextBillingAt: Date | null = null;

  // Fallback sync: if webhook delivery was missed locally, recover plan status
  // from Stripe on dashboard load.
  if (stripe && user.stripeCustomerId) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: "all",
        limit: 5,
      });
      const latest = subscriptions.data[0];
      if (latest) {
        const status = latest.status;
        const shouldBePro = status === "active" || status === "trialing";
        const periodEnd = (latest as { current_period_end?: number }).current_period_end;
        if (typeof periodEnd === "number") {
          nextBillingAt = new Date(periodEnd * 1000);
        }
        if (
          user.subscriptionStatus !== status ||
          user.plan !== (shouldBePro ? "pro" : "free") ||
          user.stripeSubscriptionId !== latest.id
        ) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: status,
              plan: shouldBePro ? "pro" : "free",
              stripeSubscriptionId: latest.id,
            },
          });
        }
      }
    } catch {
      // Keep page usable even when Stripe API is temporarily unavailable.
    }
  }
  const sp = await searchParams;
  const checkoutOk = sp.checkout === "success";

  return (
    <div className={`${styles.wrap} ${styles.narrow}`}>
      <h1 className={styles.title}>控制台</h1>
      {checkoutOk ? (
        <p className={styles.notice}>
          支付流程已完成。若已配置 Stripe Webhook，会员状态会自动同步。
        </p>
      ) : null}
      <dl className={styles.kv}>
        <div className={styles.kvItem}>
          <dt>邮箱</dt>
          <dd>{user.email}</dd>
        </div>
        <div className={styles.kvItem}>
          <dt>套餐</dt>
          <dd>{user.plan}</dd>
        </div>
        <div className={styles.kvItem}>
          <dt>订阅状态</dt>
          <dd>{user.subscriptionStatus ?? "—"}</dd>
        </div>
        <div className={styles.kvItem}>
          <dt>下次扣费</dt>
          <dd>
            {nextBillingAt
              ? nextBillingAt.toLocaleString("zh-CN", { dateStyle: "medium", timeStyle: "short" })
              : "—"}
          </dd>
        </div>
      </dl>
      <div className={styles.actions}>
        <Link href="/community/new" className={styles.btnPrimary}>
          发布社区帖子
        </Link>
        <Link href="/pricing" className={styles.btnGhost}>
          管理订阅 / 定价
        </Link>
        <Link href="/login?switch=1" className={styles.btnGhost}>
          切换账号
        </Link>
        <Link href="/register?switch=1" className={styles.btnGhost}>
          注册新账号
        </Link>
      </div>
      <div className={styles.actions}>
        <BillingPortalButton enabled={Boolean(user.stripeCustomerId)} />
      </div>
    </div>
  );
}
