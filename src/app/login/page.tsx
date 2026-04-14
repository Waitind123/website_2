import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { getSessionUserId } from "@/lib/session";
import styles from "@/app/inner.module.css";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ switch?: string }>;
}) {
  const sp = await searchParams;
  const allowSwitch = sp.switch === "1";
  const uid = await getSessionUserId();
  if (uid && !allowSwitch) {
    redirect("/dashboard");
  }

  return (
    <div className={`${styles.wrap} ${styles.authWrap}`}>
      <div className={styles.top}>
        <h1 className={styles.title}>登录</h1>
        {allowSwitch ? (
          <p className={styles.sub}>你正在切换账号。直接登录新账号即可。</p>
        ) : null}
        <p className={styles.sub}>
          没有账号？{" "}
          <Link href={allowSwitch ? "/register?switch=1" : "/register"} className={styles.linkInline}>
            注册
          </Link>
        </p>
      </div>
      <Suspense fallback={<p className={styles.sub}>加载表单…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
