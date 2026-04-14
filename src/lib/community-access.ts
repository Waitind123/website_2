import { prisma } from "@/lib/prisma";

export async function getCommunityUsage(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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
    return null;
  }

  const isPro = user.plan === "pro";
  const used = user._count.posts + user._count.comments > 0 ? 1 : 0;
  const remainingFreeActions = isPro ? 999 : Math.max(0, 1 - used);
  return {
    isPro,
    remainingFreeActions,
    canCreatePostOrComment: isPro || remainingFreeActions > 0,
  };
}
