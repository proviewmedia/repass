// Google Analytics 4, loaded only when NEXT_PUBLIC_GA_ID is set.
//
// Gating on the env var means this ships inert and starts working the moment
// the measurement ID is added, with no code change and no redeploy of a
// half-configured tag. It also keeps analytics out of local development, so
// your own page views never pollute the numbers.
//
// Deliberately not loaded on the dashboard: those are authenticated pages
// behind a login, and sending a merchant's in-app behaviour to Google is a
// privacy commitment the Privacy Notice does not make. See <Analytics /> usage
// in app/layout.tsx and the pathname guard below.

"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// Everything a logged-out visitor can see is fair game; everything behind the
// login is not.
const PRIVATE_PREFIXES = ["/dashboard", "/admin", "/onboarding", "/checkin", "/join"];

export function Analytics() {
  const pathname = usePathname();

  if (!GA_ID) return null;
  if (PRIVATE_PREFIXES.some((p) => pathname?.startsWith(p))) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
