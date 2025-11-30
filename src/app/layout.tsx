import type { Metadata } from "next";
import { Special_Elite } from "next/font/google";
import "./globals.css";

const specialElite = Special_Elite({
  weight: "400",
  variable: "--font-special-elite",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Noir - Case #2025-001",
  description: "A text-based murder mystery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${specialElite.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
