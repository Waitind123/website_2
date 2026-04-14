"use client";

import { useState } from "react";
import ui from "@/components/ui.module.css";

export function BillingPortalButton({ enabled }: { enabled: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (!enabled) {
      setError("当前账号还没有可管理的 Stripe 账单。");
      return;
    }
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "无法打开账单中心");
        return;
      }
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("网络异常，请稍后重试。");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={ui.form}>
      <button
        type="button"
        className={ui.btnGhost}
        onClick={onClick}
        disabled={pending || !enabled}
      >
        {pending ? "跳转中…" : "打开账单中心（Stripe Portal）"}
      </button>
      {error ? <p className={ui.subStatus}>{error}</p> : null}
    </div>
  );
}
