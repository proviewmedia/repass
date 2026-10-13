// The printable review poster, shared by the dashboard preview and the print
// route so what a business sees is exactly what comes out of the printer.
//
// Every dimension is in `em`, and the only thing that changes between a phone
// preview and a sheet of A4 is the font-size on the wrapper. That is what lets
// one component serve six paper sizes without a separate layout for each.

export type ReviewPlatform = "google" | "yelp" | "facebook" | "tripadvisor" | "other";
export type ReviewTheme = "light" | "dark";
export type PaperSize = "letter" | "a4" | "half-letter" | "a5" | "5x7" | "4x6";

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
export const PAPER: Record<PaperSize, { label: string; css: string; width: string; ratio: number }> = {
  letter: { label: 'US Letter, 8.5 x 11"', css: "8.5in 11in", width: "8.5in", ratio: 8.5 / 11 },
  a4: { label: "A4, 210 x 297mm", css: "210mm 297mm", width: "210mm", ratio: 210 / 297 },
  "half-letter": { label: 'Half Letter, 5.5 x 8.5"', css: "5.5in 8.5in", width: "5.5in", ratio: 5.5 / 8.5 },
  a5: { label: "A5, 148 x 210mm", css: "148mm 210mm", width: "148mm", ratio: 148 / 210 },
  "5x7": { label: '5 x 7"', css: "5in 7in", width: "5in", ratio: 5 / 7 },
  "4x6": { label: '4 x 6"', css: "4in 6in", width: "4in", ratio: 4 / 6 },
};

/** The poster is laid out against this many em across the short edge. One
 *  number ties the preview scale and the print scale together. */
export const POSTER_EM_WIDTH = 30;

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
