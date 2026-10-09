// The image that renders when the site is shared: iMessage, Slack, LinkedIn,
// X, Facebook. Without one, a shared link is a line of grey text, which for a
// product being passed between a shop owner and their business partner is the
// first impression doing no work at all.
//
// Generated rather than designed as a static file so it stays in step with the
// brand colours and copy, and so there is no 1200x630 PNG to re-export by hand
// every time the positioning changes.
//
// Deliberately set in the default sans rather than Poppins: pulling a webfont
// into ImageResponse means a network fetch at render time, and a failed fetch
// is a broken preview image rather than a slightly off one. The mark carries
// the brand here.

import { ImageResponse } from "next/og";

export const alt = "Repass Connect: wallet loyalty programs for local businesses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0f",
          padding: 84,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 22,
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="44" height="44" viewBox="0 0 238.6 238.56" fill="#0a0a0f">
              <path d="M203.55,203.52l35.04,35.04h-119.28v-68.16c14.06,0,26.84-5.76,36.1-15.01,9.26-9.27,15.01-22.05,15.01-36.1s-5.76-26.84-15.01-36.1c-9.27-9.26-22.05-15.01-36.1-15.01s-26.84,5.76-36.1,15.01c-9.26,9.27-15.01,22.05-15.01,36.1v119.28H.03v-119.28C.03,86.48,13.45,56.66,35.07,35.04c9.58-9.58,20.77-17.55,33.12-23.45C83.7,4.17,101.05,0,119.31,0c32.8,0,62.62,13.42,84.24,35.04,21.61,21.62,35.04,51.44,35.04,84.24,0,18.26-4.17,35.6-11.59,51.12-5.9,12.35-13.87,23.54-23.45,33.12Z" />
            </svg>
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, color: "#ffffff", letterSpacing: -1 }}>Repass Connect</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: -2.5,
              lineHeight: 1.05,
              maxWidth: 940,
            }}
          >
            Loyalty cards that live in your customers&apos; phones.
          </div>
          <div style={{ fontSize: 31, color: "#9a9aa8", maxWidth: 880, lineHeight: 1.35 }}>
            Apple and Google Wallet programs for local businesses. No app to download.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 25, color: "#6f6f80" }}>
          <span>repassconnect.com</span>
          <span style={{ color: "#2e2e3d" }}>/</span>
          <span>{"Square, Clover, and Stripe"}</span>
          <span style={{ color: "#2e2e3d" }}>/</span>
          <span>$49 a month</span>
        </div>
      </div>
    ),
    size,
  );
}
