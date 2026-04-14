import Link from "next/link";
import styles from "./home.module.css";

const painPoints = [
  {
    title: "拍摄成本与时间",
    body: "传统人像与产品拍摄排期长、单价高，反馈慢。用生成式流程在数分钟内完成一整套视觉素材。",
  },
  {
    title: "工具碎片化",
    body: "修图、换景、脚本与分发各用一套工具。Lumina 将创作、社区讨论与分享链接统一到同一工作空间。",
  },
  {
    title: "冷启动与传播",
    body: "作品缺少曝光与同伴反馈。社区帖子支持评论互动与一键复制分享链接，方便外站传播与协作。",
  },
];

const stats = [
  { label: "首帧生成", value: "< 60s", hint: "本地演示目标" },
  { label: "工作区", value: "创作 + 社区", hint: "一体化" },
  { label: "付费", value: "Stripe", hint: "订阅 Pro" },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.bgGlow} />
      <div className={styles.bgGrid} />
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroLeft}>
            <p className={styles.eyebrow}>AI CREATIVE STUDIO</p>
            <h1 className={styles.title}>
              用 Lumina
              <span className={styles.titleGradient}> 解决创作链路 </span>
              的最后一公里
            </h1>
            <p className={styles.desc}>
              灵感来自 Photo AI 的一键成片体验与 Nuwa 式专业叙事：更快出图、可协作、可订阅、可分享——从痛点到增长闭环。
            </p>
            <div className={styles.ctaRow}>
              <Link href="/register" className={styles.ctaPrimary}>
                免费注册
              </Link>
              <Link href="/pricing" className={styles.ctaGhost}>
                查看套餐
              </Link>
              <Link href="/community" className={styles.ctaSoft}>
                浏览社区
              </Link>
            </div>
          </div>
          <div className={styles.heroRight}>
            {stats.map((s) => (
              <div key={s.label} className={styles.statCard}>
                <p className={styles.statLabel}>{s.label}</p>
                <p className={styles.statValue}>{s.value}</p>
                <p className={styles.statHint}>{s.hint}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>痛点与方案</h2>
          <p className={styles.sectionSub}>围绕真实工作流设计功能，而不是堆叠噱头。</p>
          <div className={styles.painGrid}>
            {painPoints.map((p) => (
              <div key={p.title} className={styles.painCard}>
                <h3 className={styles.painTitle}>{p.title}</h3>
                <p className={styles.painBody}>{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.launchCard}>
          <div className={styles.launchText}>
            <h3>准备上线到公网</h3>
            <p>
              本项目基于 Next.js App Router，可一键部署到 Vercel / 任意 Node 主机；数据库使用 Prisma（本地
              SQLite，生产可换 PostgreSQL）；支付通过 Stripe Checkout 与 Webhook 完成订阅状态同步。
            </p>
          </div>
          <Link href="/register" className={styles.ctaPrimary}>
            立即开始
          </Link>
        </section>
      </main>
    </div>
  );
}
