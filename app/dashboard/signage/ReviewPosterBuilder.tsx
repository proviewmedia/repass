"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Printer } from "lucide-react";
import {
  DEFAULT_CTA,
  PAPER,
  PLATFORM_LABELS,
  ReviewPoster,
  defaultHeadline,
  type PaperSize,
  type ReviewPlatform,
  type ReviewTheme,
} from "@/components/review-poster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ReviewPosterInitial {
  businessName: string;
  reviewUrl: string;
  platform: ReviewPlatform;
  headline: string;
  cta: string;
  footer: string;
  theme: ReviewTheme;
  showStars: boolean;
  paper: PaperSize;
}

/**
 * The preview is live because the whole point of this page is "what will come
 * out of the printer". Making them save to find out would mean a round trip per
 * tweak, and the QR is the one part they cannot sanity-check from a form field.
 */
export default function ReviewPosterBuilder({ initial }: { initial: ReviewPosterInitial }) {
  const [reviewUrl, setReviewUrl] = useState(initial.reviewUrl);
  const [platform, setPlatform] = useState<ReviewPlatform>(initial.platform);
  const [headline, setHeadline] = useState(initial.headline);
  const [cta, setCta] = useState(initial.cta);
  const [footer, setFooter] = useState(initial.footer);
  const [theme, setTheme] = useState<ReviewTheme>(initial.theme);
  const [showStars, setShowStars] = useState(initial.showStars);
  const [paper, setPaper] = useState<PaperSize>(initial.paper);
  const [qr, setQr] = useState<string | null>(null);

  // Scales the em-based poster to whatever width the preview column happens to
  // be, so the proportions match the printed sheet at any browser size.
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(16);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      // 30em across the short edge is what the poster is laid out against.
      setScale(entry.contentRect.width / 30);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const trimmed = reviewUrl.trim();
    if (!trimmed) {
      setQr(null);
      return;
    }
    let cancelled = false;
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    QRCode.toDataURL(withScheme, { margin: 0, width: 560, errorCorrectionLevel: "M" })
      .then((url) => {
        if (!cancelled) setQr(url);
      })
      .catch(() => {
        if (!cancelled) setQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [reviewUrl]);

  const printHref = `/print/review?paper=${paper}`;
  const savedUrlDiffers = reviewUrl.trim() !== initial.reviewUrl.trim();

  return (
    <div className="dash-split">
      <div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-[17px] font-semibold">Review poster</h2>
          <p className="auth-sub mt-1">
            Paste where you want reviews left, pick a paper size, and print it for your counter.
          </p>

          <div className="mt-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reviewUrl">Review link</Label>
              <Input
                id="reviewUrl"
                name="reviewUrl"
                type="text"
                inputMode="url"
                placeholder="https://g.page/r/..."
                value={reviewUrl}
                onChange={(e) => setReviewUrl(e.target.value)}
              />
              <p className="auth-sub text-[12.5px]">
                Anywhere you want people to land: a Google review link, a Yelp page, your own site.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="platform">Where are reviews left?</Label>
              <select
                id="platform"
                name="platform"
                className="h-11 rounded-lg border border-input bg-transparent px-3 text-[15px]"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as ReviewPlatform)}
              >
                {(Object.keys(PLATFORM_LABELS) as ReviewPlatform[]).map((p) => (
                  <option key={p} value={p}>
                    {PLATFORM_LABELS[p] || "Somewhere else"}
                  </option>
                ))}
              </select>
              <p className="auth-sub text-[12.5px]">Sets the wording on the poster. Leave the headline blank to use it.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                name="headline"
                type="text"
                placeholder={defaultHeadline(platform)}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cta">Instruction line</Label>
              <Input
                id="cta"
                name="cta"
                type="text"
                placeholder={DEFAULT_CTA}
                value={cta}
                onChange={(e) => setCta(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="footer">Footer, optional</Label>
              <Input
                id="footer"
                name="footer"
                type="text"
                placeholder="yourshop.com"
                value={footer}
                onChange={(e) => setFooter(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="paper">Paper size</Label>
                <select
                  id="paper"
                  name="paper"
                  className="h-11 rounded-lg border border-input bg-transparent px-3 text-[15px]"
                  value={paper}
                  onChange={(e) => setPaper(e.target.value as PaperSize)}
                >
                  {(Object.keys(PAPER) as PaperSize[]).map((p) => (
                    <option key={p} value={p}>
                      {PAPER[p].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="theme">Colour</Label>
                <select
                  id="theme"
                  name="theme"
                  className="h-11 rounded-lg border border-input bg-transparent px-3 text-[15px]"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as ReviewTheme)}
                >
                  <option value="light">Light, saves ink</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-[15px]">
              <input
                type="checkbox"
                name="showStars"
                checked={showStars}
                onChange={(e) => setShowStars(e.target.checked)}
                className="h-4 w-4"
              />
              Show the star row
            </label>
          </div>
        </div>
      </div>

      <div>
        <div
          ref={frameRef}
          className="rposter-preview"
          style={{ ["--paper-ratio" as string]: String(PAPER[paper].ratio) }}
        >
          <div style={{ fontSize: scale, width: "100%", height: "100%" }}>
            <ReviewPoster
              platform={platform}
              businessName={initial.businessName}
              headline={headline}
              cta={cta}
              footer={footer}
              theme={theme}
              showStars={showStars}
              qr={qr}
            />
          </div>
        </div>

        <p className="auth-sub mt-3 text-[12.5px]">
          {PAPER[paper].label}. Printing opens in a new tab.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="submit" form="review-poster-form">
            Save
          </Button>
          <a
            href={printHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn ghost sm"
            aria-disabled={!initial.reviewUrl}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </a>
        </div>

        {!initial.reviewUrl && (
          <p className="auth-sub mt-2 text-[12.5px]">Save a review link before printing.</p>
        )}
        {initial.reviewUrl && savedUrlDiffers && (
          <p className="auth-sub mt-2 text-[12.5px]">
            You have unsaved changes. Printing uses the last saved version.
          </p>
        )}

        {/* The form holds the real submitted values; the controls above are the
            live-preview surface. Keeping them in sync here rather than wiring
            every input to a hidden twin keeps the preview the single source. */}
        <input type="hidden" form="review-poster-form" name="reviewUrl" value={reviewUrl} />
        <input type="hidden" form="review-poster-form" name="platform" value={platform} />
        <input type="hidden" form="review-poster-form" name="headline" value={headline} />
        <input type="hidden" form="review-poster-form" name="cta" value={cta} />
        <input type="hidden" form="review-poster-form" name="footer" value={footer} />
        <input type="hidden" form="review-poster-form" name="theme" value={theme} />
        <input type="hidden" form="review-poster-form" name="paper" value={paper} />
        {showStars && <input type="hidden" form="review-poster-form" name="showStars" value="on" />}
      </div>
    </div>
  );
}
