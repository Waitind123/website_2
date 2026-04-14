import Link from "next/link";
import { getSessionUserId } from "@/lib/session";
import { CheckoutButton } from "@/components/checkout-button";
import { prisma } from "@/lib/prisma";
import styles from "@/app/inner.module.css";

export default async function PricingPage() {
  const uid = await getSessionUserId();
  const user = uid
    ? await prisma.user.findUnique({
        where: { id: uid },
        select: { plan: true, subscriptionStatus: true },
      })
    : null;
  const isPro = user?.plan === "pro";
  const billingEnabled = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_PRO);

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <p className={styles.eyebrow}>PRICING</p>
        <h1 className={styles.title}>简单透明的套餐</h1>
        <p className={styles.sub}>
          Pro 通过 Stripe 订阅开通；如果还没配置 Stripe，你会看到禁用状态提示（本地开发可先使用 Free）。
        </p>
      </div>
      <div className={styles.grid2}>
        <div className={styles.card}>
          <h2 className={styles.planName}>Free</h2>
          <p className={styles.planPrice}>
            ¥0
            <span className={styles.planMeta}> / 月</span>
          </p>
          <ul className={styles.list}>
            <li>· 浏览社区与帖子</li>
            <li>· 注册 / 登录与基础控制台</li>
            <li>· 适合体验产品流程</li>
          </ul>
          <div className={styles.actions}>
            <Link href={uid ? "/community" : "/register"} className={styles.btnGhost}>
              {uid ? "进入社区" : "注册体验"}
            </Link>
          </div>
        </div>
        <div className={`${styles.card} ${styles.cardStrong}`}>
          <h2 className={styles.planName}>Pro</h2>
          <p className={styles.planPrice}>
            $9.90
            <span className={styles.planMeta}> / 月 · Stripe</span>
          </p>
          <ul className={styles.list}>
            <li>· 包含 Free 全部能力</li>
            <li>· Webhook 自动同步会员状态</li>
            <li>· 为未来「高级生成额度」预留字段</li>
          </ul>
          {uid ? (
            <div className={styles.actions}>
              <CheckoutButton
                billingEnabled={billingEnabled}
                alreadyPro={isPro}
                subscriptionStatus={user?.subscriptionStatus ?? null}
              />
            </div>
          ) : (
            <div className={styles.actions}>
              <Link href="/login?callbackUrl=/pricing" className={styles.btnPrimary}>
                登录后订阅
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
