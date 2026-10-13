import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import {
  PAPER,
  posterFontSizeIn,
  ReviewPoster,
  SHEET_FOR,
  needsCutLine,
  type PaperSize,
  type ReviewPlatform,
  type ReviewTheme,
} from "@/components/review-poster";
import PrintTrigger from "./PrintTrigger";

// A page whose only job is to be printed: no chrome, no sidebar, the poster
// bled to the paper edge. Opened in its own tab so the print dialog never
// swallows the dashboard behind it.
export default async function PrintReviewPosterPage({
  searchParams,
}: {
  searchParams: { paper?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard/signage");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select(
      "name, review_url, review_platform, review_headline, review_cta, review_footer, review_theme, review_show_stars, review_paper",
    )
    .eq("owner_user_id", user!.id)
    .single();

  if (!business) {
    redirect("/onboarding");
  }

  // Printing without a link would produce a poster whose QR code goes nowhere,
  // so this sends them back to the builder with the reason rather than a 404,
  // which reads as "this page is broken" instead of "you missed a field".
  if (!business!.review_url) {
    redirect(
      "/dashboard/signage?error=" +
        encodeURIComponent("Add a review link and save before printing. The poster needs somewhere to point."),
    );
  }

  const requested = searchParams.paper as PaperSize | undefined;
  const paper: PaperSize = requested && requested in PAPER ? requested : ((business!.review_paper || "letter") as PaperSize);

  const sheet = SHEET_FOR[paper];
  const cut = needsCutLine(paper);

  const qr = await QRCode.toDataURL(business!.review_url!, {
    margin: 0,
    width: 900,
    errorCorrectionLevel: "M",
  });

  return (
    <>
      {/* @page takes the SHEET, not the poster. See SHEET_FOR for why: a page
          box smaller than the loaded paper gets scaled up by Chrome's default
          Fit to page, which is what made a 4x6 print roughly 1.8x too big. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `@page { size: ${sheet.css}; margin: 0; }`,
        }}
      />
      <PrintTrigger />
      {/* Visible on screen only. Without it the print view is a dead end: the
          dialog can be dismissed and there is no obvious way back. */}
      <div className="print-hide" style={{ padding: "12px 16px", borderBottom: "1px solid #ebebf0", fontSize: 14 }}>
        <a href="/dashboard/signage" style={{ color: "#6b7280" }}>
          Back to signage
        </a>
        <span style={{ color: "#9ca3af", marginLeft: 12 }}>
          Set <strong>Scale</strong> to 100% (not Fit to page) so it prints at exactly {PAPER[paper].label}.
          {cut ? " Cut along the dashed line." : ""} To keep a file, choose Save as PDF.
        </span>
      </div>
      <main className="print-sheet" style={{ width: sheet.width, minHeight: sheet.height }}>
        {/* Exact physical dimensions, so what it measures on paper is what the
            size says. The em-based layout resolves against this font-size. */}
        <div
          className={cut ? "print-poster print-poster-cut" : "print-poster"}
          style={{
            width: `${PAPER[paper].wIn}in`,
            height: `${PAPER[paper].hIn}in`,
            fontSize: `${posterFontSizeIn(paper)}in`,
          }}
        >
          <ReviewPoster
            platform={(business!.review_platform || "google") as ReviewPlatform}
            businessName={business!.name}
            headline={business!.review_headline}
            cta={business!.review_cta}
            footer={business!.review_footer}
            theme={(business!.review_theme || "light") as ReviewTheme}
            showStars={business!.review_show_stars ?? true}
            qr={qr}
          />
        </div>
      </main>
    </>
  );
}
