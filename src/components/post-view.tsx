import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { getRequestOrigin } from "@/lib/origin";
import { CommentForm } from "@/components/comment-form";
import { ShareLinkButton } from "@/components/share-link-button";
import ui from "@/components/ui.module.css";
import { getCommunityUsage } from "@/lib/community-access";

function formatDate(d: Date) {
  return d.toLocaleString("zh-CN", { dateStyle: "medium", timeStyle: "short" });
}

export async function PostView({ id }: { id: string }) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { name: true, email: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, email: true } } },
      },
    },
  });
  if (!post) {
    notFound();
  }

  const uid = await getSessionUserId();
  const usage = uid ? await getCommunityUsage(uid) : null;
  const canComment = usage?.canCreatePostOrComment ?? false;
  const origin = await getRequestOrigin();
  const shareUrl = `${origin}/share/post/${post.id}`;

  return (
    <article className={ui.article}>
      <div className={ui.articleTop}>
        <div>
          <p className={ui.articleDate}>{formatDate(post.createdAt)}</p>
          <h1 className={ui.articleTitle}>{post.title}</h1>
          <p className={ui.articleAuthor}>
            作者 · {post.author.name ?? post.author.email}
          </p>
        </div>
        <div className={ui.actionsInline}>
          <ShareLinkButton href={shareUrl} />
          <Link href="/community" className={ui.btnGhost}>
            返回社区
          </Link>
        </div>
      </div>
      <div className={ui.articleBody}>
        {post.content}
      </div>

      <section className={ui.articleSection}>
        <h2 className={ui.articleSectionTitle}>讨论 · {post.comments.length}</h2>
        <ul className={ui.commentList}>
          {post.comments.map((c) => (
            <li key={c.id} className={ui.commentItem}>
              <p className={ui.commentMeta}>
                {c.author.name ?? c.author.email} · {formatDate(c.createdAt)}
              </p>
              <p className={ui.commentText}>{c.content}</p>
            </li>
          ))}
        </ul>
        {uid ? (
          <>
            {usage && !usage.isPro ? (
              <p className={ui.hint}>
                免费剩余次数：{usage.remainingFreeActions}（帖子和评论共用 1 次） ·{" "}
                <Link href="/pricing" className={ui.inlineLink}>
                  升级 Pro
                </Link>
              </p>
            ) : null}
            <CommentForm
              postId={post.id}
              canComment={canComment}
              gateMessage="免费用户仅可发 1 条帖子或 1 条评论，继续评论请升级 Pro。"
            />
          </>
        ) : (
          <p className={ui.hint}>
            <Link href="/login" className={ui.inlineLink}>
              登录
            </Link>{" "}
            后参与讨论与评论。
          </p>
        )}
      </section>
    </article>
  );
}
