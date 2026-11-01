import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Extra Credit 제출 조회",
  description: "2026-2 수업별 Extra Credit 제출 현황 조회",
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
