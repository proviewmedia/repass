// The printable review poster, shared by the dashboard preview and the print
// route so what a business sees is exactly what comes out of the printer.
//
// Every dimension is in `em`, and the only thing that changes between a phone
// preview and a sheet of A4 is the font-size on the wrapper. That is what lets
// one component serve six paper sizes without a separate layout for each.

export type ReviewPlatform = "google" | "yelp" | "facebook" | "tripadvisor" | "other";
export type ReviewTheme = "light" | "dark";
export type PaperSize = "4x6" | "5x7" | "half-letter" | "8x10" | "letter" | "11x14" | "tabloid";

export const PLATFORM_LABELS: Record<ReviewPlatform, string> = {
  google: "Google",
  yelp: "Yelp",
  facebook: "Facebook",
  tripadvisor: "Tripadvisor",
  other: "",
};

/**
 * Physical paper dimensions, used for the print @page rule and to give the
 * on-screen preview the right proportions. `ratio` is width/height.
 */
export const PAPER: Record<PaperSize, { label: string; width: string; height: string; ratio: number }> = {
  "4x6": { label: '4 x 6" card', width: "4in", height: "6in", ratio: 4 / 6 },
  "5x7": { label: '5 x 7" card', width: "5in", height: "7in", ratio: 5 / 7 },
  "half-letter": { label: 'Half Letter, 5.5 x 8.5"', width: "5.5in", height: "8.5in", ratio: 5.5 / 8.5 },
  "8x10": { label: '8 x 10" frame', width: "8in", height: "10in", ratio: 8 / 10 },
  letter: { label: 'US Letter, 8.5 x 11"', width: "8.5in", height: "11in", ratio: 8.5 / 11 },
  "11x14": { label: '11 x 14" poster', width: "11in", height: "14in", ratio: 11 / 14 },
  tabloid: { label: 'Tabloid, 11 x 17"', width: "11in", height: "17in", ratio: 11 / 17 },
};

/** The poster is laid out against this many em across its width. One number
 *  ties the preview scale and the print scale together.
 *
 *  26 rather than 30: at 30 the content filled only about 62% of a 4x6 card's
 *  height, which is most of why small sizes read as sparse. Checked for
 *  overflow at every size; the tightest is 8x10 at ~86% of the height. */
export const POSTER_EM_WIDTH = 26;

/**
 * The sheet that actually goes through the printer, which is not the same
 * thing as the poster.
 *
 * Anything Letter-sized or smaller prints on Letter, because that is the paper
 * a shop has. Setting @page to the *poster* size was the bug: Chrome built, say,
 * a 4x6 page box and then its default "Fit to page" scaled it up to the loaded
 * Letter sheet, roughly 1.8x. Making the page box match the real paper leaves
 * nothing for that scaling to act on.
 *
 * Derived rather than stored, so there is no extra column and no way for the
 * two to drift out of sync.
 */
export const SHEET_FOR: Record<PaperSize, { css: string; width: string; height: string; label: string }> = {
  "4x6": { css: "8.5in 11in", width: "8.5in", height: "11in", label: 'US Letter, 8.5 x 11"' },
  "5x7": { css: "8.5in 11in", width: "8.5in", height: "11in", label: 'US Letter, 8.5 x 11"' },
  "half-letter": { css: "8.5in 11in", width: "8.5in", height: "11in", label: 'US Letter, 8.5 x 11"' },
  "8x10": { css: "8.5in 11in", width: "8.5in", height: "11in", label: 'US Letter, 8.5 x 11"' },
  letter: { css: "8.5in 11in", width: "8.5in", height: "11in", label: 'US Letter, 8.5 x 11"' },
  "11x14": { css: "11in 14in", width: "11in", height: "14in", label: '11 x 14"' },
  tabloid: { css: "11in 17in", width: "11in", height: "17in", label: 'Tabloid, 11 x 17"' },
};

/** True when the poster is smaller than its sheet, so it needs a cut line. */
export function needsCutLine(paper: PaperSize): boolean {
  return paper !== "letter" && SHEET_FOR[paper].css === "8.5in 11in";
}

export interface ReviewPosterProps {
  platform: ReviewPlatform;
  businessName: string;
  headline?: string | null;
  cta?: string | null;
  footer?: string | null;
  theme: ReviewTheme;
  showStars: boolean;
  /** Data URL of the QR code. Null renders a placeholder, so the preview still
   *  composes correctly before a link has been entered. */
  qr: string | null;
}

export function defaultHeadline(platform: ReviewPlatform): string {
  const name = PLATFORM_LABELS[platform];
  return name ? `Review us on ${name}` : "Review us";
}

export const DEFAULT_CTA = "Scan the QR code below to leave us a review";

function Stars() {
  return (
    <div className="rp-stars" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4 6.2 20.5l1.1-6.5L2.6 9.4l6.5-.9L12 2.6z" />
        </svg>
      ))}
    </div>
  );
}

export function ReviewPoster({
  platform,
  businessName,
  headline,
  cta,
  footer,
  theme,
  showStars,
  qr,
}: ReviewPosterProps) {
  const line = headline?.trim() || defaultHeadline(platform);

  return (
    <div className={`rposter rposter-${theme}`}>
      <div className="rp-top">
        <div className="rp-eyebrow">{line}</div>
        {showStars && <Stars />}
      </div>

      <div className="rp-mid">
        <div className="rp-name">{businessName}</div>
        <div className="rp-cta">{cta?.trim() || DEFAULT_CTA}</div>
      </div>

      <div className="rp-qrwrap">
        {/* The frame doubles as the "scan me" instruction, so the QR reads as
            something to point a phone at rather than decoration. */}
        <div className="rp-frame">
          <span className="rp-scan rp-scan-t">Scan me</span>
          <span className="rp-scan rp-scan-b">Scan me</span>
          <span className="rp-scan rp-scan-l">Scan me</span>
          <span className="rp-scan rp-scan-r">Scan me</span>
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt={`QR code linking to a review page for ${businessName}`} className="rp-qr" />
          ) : (
            <div className="rp-qr rp-qr-empty">Add your review link</div>
          )}
        </div>
      </div>

      <div className="rp-foot">{footer?.trim() || ""}</div>
    </div>
  );
}
