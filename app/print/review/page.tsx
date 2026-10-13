import { redirect, notFound } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import {
  PAPER,
  POSTER_EM_WIDTH,
  ReviewPoster,
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

  if (!business || !business.review_url) {
    notFound();
  }

  const requested = searchParams.paper as PaperSize | undefined;
  const paper: PaperSize = requested && requested in PAPER ? requested : ((business!.review_paper || "letter") as PaperSize);

  const qr = await QRCode.toDataURL(business!.review_url!, {
    margin: 0,
    width: 900,
    errorCorrectionLevel: "M",
  });

  return (
    <>
      {/* @page size has to be literal CSS, so it is emitted per paper choice
          rather than set from a variable. Zero margin lets the poster's own
          padding control the trim, which keeps it identical to the preview. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `@page { size: ${PAPER[paper].css}; margin: 0; }`,
        }}
      />
      <PrintTrigger />
      {/* Scaled from the paper's real width rather than viewport units, which
          browsers resolve inconsistently inside a print context. */}
      <main
        className="rposter-print"
        style={{ fontSize: `calc(${PAPER[paper].width} / ${POSTER_EM_WIDTH})` }}
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
      </main>
    </>
  );
}
