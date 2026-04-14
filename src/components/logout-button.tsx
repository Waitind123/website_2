"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onLogout() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
    router.push("/");
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={pending}
      className="logout-btn"
    >
      {pending ? "退出中…" : "退出"}
    </button>
  );
}
