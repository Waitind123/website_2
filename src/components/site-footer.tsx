import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="footer-left">© {new Date().getFullYear()} Lumina Studio</p>
        <div className="footer-right">
          <Link href="/pricing" className="footer-link">
            套餐
          </Link>
          <Link href="/community" className="footer-link">
            社区
          </Link>
          <span>部署就绪 · Next.js</span>
        </div>
      </div>
    </footer>
  );
}
