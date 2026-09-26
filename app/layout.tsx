import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "./components/Providers";

export const metadata: Metadata = {
  title: "WOTU Quote",
  description: "Hệ thống báo giá WOTU Design Build.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
