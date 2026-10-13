import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Alert } from "@/components/ui/alert";
import ReviewPosterBuilder from "./ReviewPosterBuilder";
import { saveReviewPoster } from "./actions";
import type { PaperSize, ReviewPlatform, ReviewTheme } from "@/components/review-poster";

export default async function SignagePage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string };
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
      "id, name, review_url, review_platform, review_headline, review_cta, review_footer, review_theme, review_show_stars, review_paper",
    )
    .eq("owner_user_id", user!.id)
    .single();

  if (!business) {
    redirect("/onboarding");
  }

  return (
    <main className="dash-content">
      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="dash-head">
          <div>
            <h1>Signage</h1>
            <p className="auth-sub">Printable signs for your counter. Customers scan with their phone camera.</p>
          </div>
        </div>

        {searchParams.error && <Alert variant="destructive">{searchParams.error}</Alert>}
        {searchParams.saved && <Alert>Poster settings saved. You can print it now.</Alert>}

        {/* The form wraps nothing visible: the builder's inputs target it by id
            so the live preview and the submitted values stay one set of state. */}
        <form id="review-poster-form" action={saveReviewPoster} />

        <ReviewPosterBuilder
          initial={{
            businessName: business!.name,
            reviewUrl: business!.review_url || "",
            platform: (business!.review_platform || "google") as ReviewPlatform,
            headline: business!.review_headline || "",
            cta: business!.review_cta || "",
            footer: business!.review_footer || "",
            theme: (business!.review_theme || "light") as ReviewTheme,
            showStars: business!.review_show_stars ?? true,
            paper: (business!.review_paper || "letter") as PaperSize,
          }}
        />
      </div>
    </main>
  );
}
