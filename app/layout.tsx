import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Analytics } from "@/components/analytics";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://repassconnect.com";

const TITLE = "Repass Connect: Wallet loyalty and membership programs for local businesses";
const DESCRIPTION =
  "Digital loyalty cards that live in Apple Wallet and Google Wallet. No app for your customers to download. Connects to Square, Clover, and Stripe so points add themselves. $49 a month, no transaction fees.";

export const metadata: Metadata = {
  // Required for Next.js to resolve the relative URLs below into absolute
  // ones. Without it, Open Graph and canonical tags silently emit relative
  // paths, which crawlers and link previews ignore.
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    // Subpages set their own short title; this keeps the brand on the end of
    // it without every page repeating the full sentence above.
    template: "%s | Repass Connect",
  },
  description: DESCRIPTION,
  applicationName: "Repass Connect",
  keywords: [
    "digital loyalty card",
    "Apple Wallet loyalty card",
    "Google Wallet loyalty card",
    "loyalty program for small business",
    "stamp card app",
    "coffee shop loyalty program",
    "Square loyalty integration",
    "Clover loyalty integration",
    "punch card replacement",
  ],
  authors: [{ name: "CV Management Solutions, LLC" }],
  creator: "CV Management Solutions, LLC",
  publisher: "CV Management Solutions, LLC",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Repass Connect",
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  // Set GOOGLE_SITE_VERIFICATION once Search Console gives you a token, and
  // the meta tag appears without a code change.
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
