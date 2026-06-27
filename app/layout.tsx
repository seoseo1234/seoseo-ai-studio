import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "학습용 웹앱 큐레이션 포털",
  description: "개발자가 직접 제작한 다양한 학습용 웹앱을 한곳에 모아 체계적으로 관리하고 실행할 수 있는 통합 웹 포털",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
