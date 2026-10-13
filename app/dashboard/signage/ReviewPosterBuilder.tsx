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
  // Only a *saved* link can be printed: the print route reads the database,
  // not this form's state.
  const canPrint = Boolean(initial.reviewUrl);
  // Shown once they have typed enough to mean something, so the field does not
  // scold them on the first keystroke.
  const urlLooksWrong = reviewUrl.trim().length > 3 && qr === null;
  // A QR was generated, so the link parses. The server checks this again; this
  // is just so the button does not invite a click that can only fail.
  const canSave = Boolean(qr);
  // Which submit button was pressed, read by the server action to decide
  // whether to finish on the print view or back here.
  const [thenPrint, setThenPrint] = useState(true);

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
              {urlLooksWrong ? (
                <p className="text-[12.5px] text-destructive">
                  That does not look like a web address. It should look like g.page/r/... or yourshop.com/reviews
                </p>
              ) : (
                <p className="auth-sub text-[12.5px]">
                  Anywhere you want people to land: a Google review link, a Yelp page, your own site.
                </p>
              )}
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
          {PAPER[paper].label}. Opens in a new tab. To keep a file instead of printing, choose{" "}
          <strong>Save as PDF</strong> as the destination in the print dialog.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {/* One obvious primary action. The previous two-step "Save, wait for
              a reload, then find Print" was the source of most of the
              confusion about what Save even did. */}
          <Button
            type="submit"
            form="review-poster-form"
            disabled={!canSave}
            onClick={() => setThenPrint(true)}
            className="justify-center"
          >
            <Printer className="mr-2 h-4 w-4" />
            Save and print
          </Button>

          <Button
            type="submit"
            form="review-poster-form"
            variant="ghost"
            disabled={!canSave}
            onClick={() => setThenPrint(false)}
            className="justify-center"
          >
            Save settings only
          </Button>
        </div>

        <div className="mt-3 rounded-lg bg-secondary/60 p-3 text-[12.5px] leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">Save and print</strong> stores your choices and opens the print
            dialog.
          </p>
          <p className="mt-1.5">
            To keep a file instead of printing on paper, set the dialog&apos;s destination to{" "}
            <strong className="text-foreground">Save as PDF</strong>. Your computer will ask where to put it.
          </p>
          {!canSave && (
            <p className="mt-1.5 text-destructive">
              Add a review link above to continue. Everything else is optional.
            </p>
          )}
          {canPrint && savedUrlDiffers && (
            <p className="mt-1.5">You have unsaved changes. Save to use them.</p>
          )}
        </div>

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
        {thenPrint && <input type="hidden" form="review-poster-form" name="thenPrint" value="1" />}
      </div>
    </div>
  );
}
