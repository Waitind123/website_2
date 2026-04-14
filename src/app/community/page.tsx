import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import styles from "@/app/inner.module.css";
import { getCommunityUsage } from "@/lib/community-access";

function formatDate(d: Date) {
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "short", day: "numeric" });
}

export default async function CommunityPage() {
  const uid = await getSessionUserId();
  const usage = uid ? await getCommunityUsage(uid) : null;
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
    include: {
      author: { select: { name: true, email: true } },
      _count: { select: { comments: true } },
    },
  });

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <div>
          <p className={styles.eyebrow}>COMMUNITY</p>
          <h1 className={styles.title}>社区</h1>
          <p className={styles.sub}>分享创作经验、教程与作品点评——帖子可生成公开分享链接。</p>
        </div>
        <div className={styles.actions}>
          {uid ? (
            <Link href="/community/new" className={styles.btnPrimary}>
              发帖
            </Link>
          ) : (
            <Link href="/login?callbackUrl=/community/new" className={styles.btnGhost}>
              登录后发帖
            </Link>
          )}
        </div>
        {usage && !usage.isPro ? (
          <p className={styles.sub}>
            免费剩余次数：{usage.remainingFreeActions}（发帖/评论共用 1 次） ·{" "}
            <Link href="/pricing" className={styles.linkInline}>
              升级 Pro
            </Link>
          </p>
        ) : null}
      </div>

      <ul className={styles.listWrap}>
        {posts.length === 0 ? (
          <li className={styles.empty}>
            暂无帖子，成为第一个分享者。
          </li>
        ) : (
          posts.map((p) => (
            <li key={p.id}>
              <Link href={`/community/${p.id}`} className={styles.postItem}>
                <div className={styles.postTop}>
                  <h2 className={styles.postTitle}>{p.title}</h2>
                  <span className={styles.postDate}>{formatDate(p.createdAt)}</span>
                </div>
                <p className={styles.postBody}>
                  {p.content.length > 140 ? `${p.content.slice(0, 140)}...` : p.content}
                </p>
                <p className={styles.postMeta}>
                  {p.author.name ?? p.author.email} · 评论 {p._count.comments}
                </p>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
