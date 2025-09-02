import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ArchiTxt - AI-Powered Architecture Diagram Generator",
  description: "Transform your system architecture ideas into professional PlantUML diagrams using natural language. ArchiTxt makes creating software architecture diagrams fast, easy, and intuitive.",
  keywords: [
    "architecture diagrams",
    "PlantUML",
    "AI diagram generator",
    "software architecture",
    "system design",
    "UML diagrams",
    "component diagrams",
    "sequence diagrams",
    "deployment diagrams",
    "natural language processing"
  ],
  authors: [{ name: "Syed Muhammad Saleh" }],
  creator: "Syed Muhammad Saleh",
  publisher: "Syed Muhammad Saleh",
  applicationName: "ArchiTxt",
  category: "Developer Tools",
  classification: "Software Development",
  openGraph: {
    title: "ArchiTxt - AI-Powered Architecture Diagram Generator",
    description: "Transform your system architecture ideas into professional PlantUML diagrams using natural language.",
    type: "website",
    siteName: "ArchiTxt",
  },
  twitter: {
    card: "summary_large_image",
    title: "ArchiTxt - AI-Powered Architecture Diagram Generator",
    description: "Transform your system architecture ideas into professional PlantUML diagrams using natural language.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  verification: {
    google: undefined, // Add Google Search Console verification if needed
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" />
        <meta name="google-site-verification" content="ImeNxjESTQgrNQVFRDOdK-3TCw44JI-eJDIfLRCyPzk" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
