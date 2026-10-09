import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://repassconnect.com";

// Everything behind a login is disallowed. None of it is useful in a search
// result, and /join and /checkin are per-business customer-facing URLs that
// should be reached from a business's own QR code or link, not from Google.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/onboarding", "/api/", "/join/", "/checkin/", "/login", "/signup"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
