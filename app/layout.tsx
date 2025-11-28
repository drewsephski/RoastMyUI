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

export const maxDuration = 60;

export const metadata: Metadata = {
  title: 'Roast My UI',
  description: 'Get your UI roasted by a savage Gen Z AI',
  icons: {
    icon: '/roast.png',
    shortcut: '/roast.png',
    apple: '/roast.png',
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
            href="/roast.png"
            type="image/png"
            sizes="any"
          />
          <link
            rel="apple-touch-icon"
            href="/roast.png"
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