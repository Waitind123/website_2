"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ui from "@/components/ui.module.css";

export function NewPostForm({
  canPublish,
  gateMessage,
}: {
  canPublish: boolean;
  gateMessage?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canPublish) {
      setError(gateMessage ?? "请升级 Pro 后继续。");
      return;
    }
    setError(null);
    setPending(true);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    setPending(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "发布失败");
      return;
    }
    const data = (await res.json()) as { post: { id: string } };
    router.push(`/community/${data.post.id}`);
  }

  return (
    <form onSubmit={onSubmit} className={ui.form}>
      <label className={ui.field}>
        标题
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          className={ui.input}
        />
      </label>
      <label className={ui.field}>
        内容
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={10}
          className={ui.textarea}
        />
      </label>
      {error ? <p className={ui.error}>{error}</p> : null}
      <button
        type="submit"
        disabled={pending || !canPublish}
        className={ui.btnPrimary}
      >
        {pending ? "发布中…" : canPublish ? "发布到社区" : "升级 Pro 后发布"}
      </button>
    </form>
  );
}
