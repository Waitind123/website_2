"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ui from "@/components/ui.module.css";

export function CommentForm({
  postId,
  canComment,
  gateMessage,
}: {
  postId: string;
  canComment: boolean;
  gateMessage?: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canComment) {
      setError(gateMessage ?? "请升级 Pro 后继续评论。");
      return;
    }
    setError(null);
    setPending(true);
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setPending(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "评论失败");
      return;
    }
    setContent("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className={ui.form}>
      <p className={ui.hint}>发表评论</p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        rows={3}
        placeholder="友善交流，分享观点…"
        className={ui.textarea}
      />
      {error ? <p className={ui.error}>{error}</p> : null}
      <button
        type="submit"
        disabled={pending || !canComment}
        className={ui.btnSecondary}
      >
        {pending ? "发送中…" : canComment ? "发送" : "升级 Pro 后评论"}
      </button>
    </form>
  );
}
