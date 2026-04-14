"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import ui from "@/components/ui.module.css";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callback = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      setPending(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "登录失败");
        return;
      }
      router.refresh();
      router.push(callback.startsWith("/") ? callback : "/dashboard");
    } catch {
      setError("网络请求失败，请稍后重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={ui.form}>
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
        密码
        <input
          type="password"
          autoComplete="current-password"
          required
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
        {pending ? "登录中…" : "登录"}
      </button>
    </form>
  );
}
