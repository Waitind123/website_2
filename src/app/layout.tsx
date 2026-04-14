import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { AnalyticsTracker } from "@/components/analytics-tracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Lumina Studio — AI 创作与社区",
    template: "%s · Lumina",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  description:
    "解决拍摄成本、工具碎片化与传播冷启动：生成式创作工作流、社区讨论、分享链接与 Stripe 订阅。可部署到公网。",
  openGraph: {
    title: "Lumina Studio — AI 创作与社区",
    description:
      "解决拍摄成本、工具碎片化与传播冷启动：生成式创作工作流、社区讨论、分享链接与 Stripe 订阅。",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lumina Studio — AI 创作与社区",
    description:
      "更快创作、社区分享、订阅变现的一体化平台。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="app-shell">
        <AnalyticsTracker />
        <SiteHeader />
        <div className="app-main">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
