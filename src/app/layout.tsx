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

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

// ... imports

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#d97706',
          colorBackground: '#09090b',
          colorText: '#e4e4e7',
          colorInputBackground: '#18181b',
          colorInputText: '#e4e4e7',
          borderRadius: '0px',
          fontFamily: 'monospace',
        },
        elements: {
          card: 'bg-zinc-900 border border-zinc-700 shadow-2xl',
          headerTitle: 'text-amber-600 font-black tracking-tighter uppercase',
          headerSubtitle: 'text-zinc-500 uppercase tracking-widest text-xs',
          formButtonPrimary: 'bg-amber-700 hover:bg-amber-600 text-black font-bold uppercase tracking-wider border-0 shadow-lg',
          footerActionLink: 'text-amber-600 hover:text-amber-500 uppercase text-xs tracking-wider',
          identityPreviewText: 'text-zinc-300 font-mono',
          formFieldLabel: 'text-zinc-400 uppercase text-xs tracking-wider font-bold',
          formFieldInput: 'bg-zinc-950 border-zinc-700 text-zinc-200 font-mono focus:border-amber-600 transition-colors',
          dividerLine: 'bg-zinc-700',
          dividerText: 'text-zinc-600 uppercase text-xs tracking-widest',
          socialButtonsBlockButton: 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-amber-700 transition-colors',
          formFieldInputShowPasswordButton: 'text-amber-600 hover:text-amber-500',
          footer: 'hidden',
        }
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${specialElite.variable} antialiased`}
          suppressHydrationWarning
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
