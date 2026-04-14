import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { LogoutButton } from "@/components/logout-button";

export async function SiteHeader() {
  const uid = await getSessionUserId();
  const user = uid
    ? await prisma.user.findUnique({
        where: { id: uid },
        select: { email: true, name: true },
      })
    : null;

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand">
          LUMINA<span className="brand-dot">.</span>
        </Link>
        <nav className="site-nav">
          <Link href="/pricing" className="site-nav-link">
            定价
          </Link>
          <Link href="/community" className="site-nav-link">
            社区
          </Link>
          {user ? (
            <>
              <span className="nav-user">
                {user.name ?? user.email}
              </span>
              <Link href="/dashboard" className="pill-link">
                控制台
              </Link>
              <Link href="/login?switch=1" className="pill-link">
                切换账号
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="site-nav-link">
                登录
              </Link>
              <Link href="/register" className="pill-link pill-link-accent">
                注册
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
