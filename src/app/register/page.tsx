import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/register-form";
import { getSessionUserId } from "@/lib/session";
import styles from "@/app/inner.module.css";

export default async function RegisterPage({
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
        <h1 className={styles.title}>注册</h1>
        {allowSwitch ? (
          <p className={styles.sub}>你正在切换账号。注册后会自动登录新账号。</p>
        ) : null}
        <p className={styles.sub}>
          已有账号？{" "}
          <Link href={allowSwitch ? "/login?switch=1" : "/login"} className={styles.linkInline}>
            登录
          </Link>
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
