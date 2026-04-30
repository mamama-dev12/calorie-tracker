import type { Metadata } from "next";
import { Geist } from "next/font/google";
import ServiceWorkerRegistrar from "./components/ServiceWorkerRegistrar";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

const BASE_URL = "https://calorie-tracker-app.vercel.app";

export const metadata: Metadata = {
  title: "カロリー管理 | 毎食のカロリー・PFCを記録",
  description: "毎食のカロリー・タンパク質・脂質・炭水化物を記録して1日の栄養バランスを管理。食品DBから選ぶだけで簡単入力。無料で使えるシンプルなカロリー管理アプリ。",
  metadataBase: new URL(BASE_URL),
  verification: {
    google: "2kYBgbz5xryW_QpoMyEpkwlTDBH13xYR22zxZFy3xLo",
  },
  openGraph: {
    title: "カロリー管理 | 毎食のカロリー・PFCを記録",
    description: "毎食のカロリー・PFCを記録して1日の栄養バランスを管理。食品DBから選ぶだけで簡単入力。",
    url: BASE_URL,
    siteName: "カロリー管理",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "カロリー管理 | 毎食のカロリー・PFCを記録",
    description: "毎食のカロリー・PFCを記録して1日の栄養バランスを管理。食品DBから選ぶだけで簡単入力。",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${geistSans.variable} h-full antialiased`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="カロリー管理" />
        <meta name="theme-color" content="#f59e0b" />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1032007530076908"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
