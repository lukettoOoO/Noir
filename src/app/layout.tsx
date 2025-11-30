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
          fontSize: '14px',
          colorDanger: '#dc2626',
          colorSuccess: '#16a34a',
          colorWarning: '#d97706',
          colorNeutral: '#71717a',
        },
        layout: {
          socialButtonsPlacement: 'top',
          socialButtonsVariant: 'blockButton',
        },
        elements: {
          rootBox: {
            backgroundColor: '#09090b',
          },
          card: {
            backgroundColor: '#18181b',
            border: '1px solid #3f3f46',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          },
          headerTitle: {
            color: '#d97706',
            fontWeight: '900',
            letterSpacing: '-0.05em',
            textTransform: 'uppercase',
            fontSize: '24px',
          },
          headerSubtitle: {
            color: '#71717a',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontSize: '11px',
          },
          formButtonPrimary: {
            backgroundColor: '#d97706',
            color: '#000000',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            border: 'none',
            boxShadow: '0 10px 15px -3px rgba(217, 119, 6, 0.3)',
            '&:hover': {
              backgroundColor: '#f59e0b',
            },
          },
          formFieldLabel: {
            color: '#a1a1aa',
            textTransform: 'uppercase',
            fontSize: '11px',
            letterSpacing: '0.1em',
            fontWeight: '700',
          },
          formFieldInput: {
            backgroundColor: '#09090b',
            borderColor: '#3f3f46',
            color: '#e4e4e7',
            fontFamily: 'monospace',
            '&:focus': {
              borderColor: '#d97706',
            },
          },
          footerActionLink: {
            color: '#d97706',
            textTransform: 'uppercase',
            fontSize: '11px',
            letterSpacing: '0.1em',
            '&:hover': {
              color: '#f59e0b',
            },
          },
          dividerLine: {
            backgroundColor: '#3f3f46',
          },
          dividerText: {
            color: '#71717a',
            textTransform: 'uppercase',
            fontSize: '11px',
            letterSpacing: '0.15em',
          },
          socialButtonsBlockButton: {
            backgroundColor: '#18181b',
            borderColor: '#3f3f46',
            color: '#d4d4d8',
            '&:hover': {
              backgroundColor: '#27272a',
              borderColor: '#d97706',
            },
          },
          footer: {
            display: 'none',
          },
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
