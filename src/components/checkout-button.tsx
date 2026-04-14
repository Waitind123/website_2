"use client";

import { useState } from "react";
import ui from "@/components/ui.module.css";

export function CheckoutButton({
  billingEnabled,
  alreadyPro,
  subscriptionStatus,
}: {
  billingEnabled: boolean;
  alreadyPro: boolean;
  subscriptionStatus: string | null;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (alreadyPro) {
      return;
    }
    if (!billingEnabled) {
      setStatus("当前服务器未配置 Stripe（缺少密钥或价格 ID），暂不可订阅。");
      return;
    }
    setStatus(null);
    setPending(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setStatus(data.error ?? "无法创建结账会话，请确认已登录并完成 Stripe 配置。");
        return;
      }
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setStatus("网络异常，稍后重试。");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={ui.form}>
      <button
        type="button"
        onClick={onClick}
        disabled={pending || !billingEnabled || alreadyPro}
        className={ui.btnPrimary}
      >
        {pending
          ? "跳转中…"
          : alreadyPro
            ? "已订阅 Pro（$9.90/月）"
            : billingEnabled
              ? "使用 Stripe 订阅 Pro（$9.90/月）"
              : "Stripe 未配置"}
      </button>
      {alreadyPro ? (
        <p className={ui.okStatus}>当前订阅状态：{subscriptionStatus ?? "active"}</p>
      ) : null}
      {status ? <p className={ui.subStatus}>{status}</p> : null}
    </div>
  );
}
