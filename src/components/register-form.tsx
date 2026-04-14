"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ui from "@/components/ui.module.css";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      setPending(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, email, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "注册失败");
        return;
      }
      router.refresh();
      router.push("/dashboard");
    } catch {
      setError("网络请求失败，请稍后重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={ui.form}>
      <label className={ui.field}>
        称呼（可选）
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={ui.input}
        />
      </label>
      <label className={ui.field}>
        邮箱
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={ui.input}
        />
      </label>
      <label className={ui.field}>
        密码（至少 8 位）
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={ui.input}
        />
      </label>
      {error ? <p className={ui.error}>{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className={ui.btnPrimary}
      >
        {pending ? "创建账号中…" : "创建账号"}
      </button>
    </form>
  );
}
