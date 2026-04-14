import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostView } from "@/components/post-view";
import styles from "@/app/inner.module.css";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id }, select: { title: true, content: true } });
  if (!post) {
    return { title: "未找到帖子" };
  }
  const description = post.content.slice(0, 160);
  return {
    title: `${post.title} · Lumina`,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
    },
  };
}

export default async function CommunityPostPage({ params }: Props) {
  const { id } = await params;
  const exists = await prisma.post.findUnique({ where: { id }, select: { id: true } });
  if (!exists) {
    notFound();
  }
  return (
    <div className={`${styles.wrap} ${styles.narrow}`}>
      <PostView id={id} />
    </div>
  );
}
