import Link from "next/link";
import { NewPostForm } from "@/components/new-post-form";
import styles from "@/app/inner.module.css";
import { getSessionUserId } from "@/lib/session";
import { getCommunityUsage } from "@/lib/community-access";
import { redirect } from "next/navigation";

export default async function NewPostPage() {
  const uid = await getSessionUserId();
  if (!uid) {
    redirect("/login?callbackUrl=/community/new");
  }
  const usage = await getCommunityUsage(uid);
  const canPublish = usage?.canCreatePostOrComment ?? false;
  const gateMessage =
    "免费用户仅可发 1 条帖子或 1 条评论，继续使用请升级 Pro。";

  return (
    <div className={`${styles.wrap} ${styles.narrow}`}>
      <h1 className={styles.title}>发布帖子</h1>
      <p className={styles.sub}>
        发布后可在帖子页复制分享链接，邀请他人在公网访问（只读）。
      </p>
      {usage && !usage.isPro ? (
        <p className={styles.sub}>
          免费剩余次数：{usage.remainingFreeActions}（帖子和评论共用 1 次）
          {" · "}
          <Link href="/pricing" className={styles.linkInline}>
            升级 Pro
          </Link>
        </p>
      ) : null}
      <div className={styles.actions}>
        <NewPostForm canPublish={canPublish} gateMessage={gateMessage} />
      </div>
    </div>
  );
}
