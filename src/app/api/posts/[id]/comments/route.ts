import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { trackEvent } from "@/lib/analytics";

const schema = z.object({
  content: z.string().min(1).max(5000),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const uid = await getSessionUserId();
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ip = getClientIp(req);
  const gate = checkRateLimit({
    key: `comment:${ip}:${uid}`,
    max: 20,
    windowMs: 60_000,
  });
  if (!gate.ok) {
    return NextResponse.json(
      { error: `操作过于频繁，请 ${gate.retryAfterSec} 秒后再试` },
      { status: 429 },
    );
  }
  const { id: postId } = await ctx.params;
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: uid },
      select: {
        id: true,
        plan: true,
        _count: {
          select: {
            posts: true,
            comments: true,
          },
        },
      },
    });
    if (!user) {
      return { error: "User not found" as const };
    }
    const isPro = user.plan === "pro";
    const used = user._count.posts + user._count.comments > 0 ? 1 : 0;
    if (!isPro && used >= 1) {
      return { error: "免费用户仅可发 1 条帖子或 1 条评论，请升级 Pro 后继续。" as const };
    }

    const comment = await tx.comment.create({
      data: {
        content: parsed.data.content,
        postId,
        authorId: uid,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });
    return { comment };
  });

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error, upgradeRequired: true, redirectTo: "/pricing" },
      { status: result.error === "User not found" ? 404 : 402 },
    );
  }

  await trackEvent({ event: "community_comment_created", userId: uid, path: `/community/${postId}` });
  return NextResponse.json({ comment: result.comment });
}
