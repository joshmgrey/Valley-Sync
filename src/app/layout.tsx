import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Valley Sync",
  description: "Real-time collaborative task board",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
