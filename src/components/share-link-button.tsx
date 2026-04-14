"use client";

import { useState } from "react";
import ui from "@/components/ui.module.css";

export function ShareLinkButton({ href, label = "复制分享链接" }: { href: string; label?: string }) {
  const [done, setDone] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(href);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      setDone(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className={ui.btnGhost}
    >
      {done ? "已复制" : label}
    </button>
  );
}
