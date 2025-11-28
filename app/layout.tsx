import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: 'Roast My UI',
  description: 'Get your UI roasted by a savage Gen Z AI',
  icons: {
    icon: [
      { url: '/icons/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-128.png', sizes: '128x128', type: 'image/png' },
    ],
    shortcut: '/icons/icon-32.png',
  },
  openGraph: {
    title: 'Roast My UI',
    description: 'Get your UI roasted by a savage Gen Z AI',
    images: [
      {
        url: '/roast.png',
        width: 1200,
        height: 630,
        alt: 'Roast My UI',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${spaceGrotesk.variable} ${spaceMono.variable}`}>
        <head>
          <link
            rel="icon"
            href="/icons/icon-32.png"
            type="image/png"
            sizes="32x32"
          />
          <link
            rel="apple-touch-icon"
            href="/icons/icon-128.png"
          />
        </head>
        <body className="font-sans antialiased bg-background text-foreground">
          <div className="noise-bg" />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}