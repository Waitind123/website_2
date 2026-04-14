import Link from "next/link";
import styles from "@/app/inner.module.css";

export default function NotFound() {
  return (
    <div className={`${styles.wrap} ${styles.authWrap}`}>
      <p className={styles.eyebrow}>404</p>
      <h1 className={styles.title}>页面不存在</h1>
      <p className={styles.sub}>链接可能已失效，或内容已被删除。</p>
      <Link href="/" className={styles.linkInline}>
        返回首页
      </Link>
    </div>
  );
}
