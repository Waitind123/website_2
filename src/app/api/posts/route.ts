import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { trackEvent } from "@/lib/analytics";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(20000),
});

export async function GET() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      author: { select: { id: true, name: true, email: true } },
      _count: { select: { comments: true } },
    },
  });
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ip = getClientIp(req);
  const gate = checkRateLimit({
    key: `post:${ip}:${uid}`,
    max: 10,
    windowMs: 60_000,
  });
  if (!gate.ok) {
    return NextResponse.json(
      { error: `操作过于频繁，请 ${gate.retryAfterSec} 秒后再试` },
      { status: 429 },
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
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

    const post = await tx.post.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        authorId: uid,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        _count: { select: { comments: true } },
      },
    });
    return { post };
  });

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error, upgradeRequired: true, redirectTo: "/pricing" },
      { status: result.error === "User not found" ? 404 : 402 },
    );
  }
  await trackEvent({ event: "community_post_created", userId: uid, path: "/community/new" });
  return NextResponse.json({ post: result.post });
}
