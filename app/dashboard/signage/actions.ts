"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PaperSize, ReviewPlatform, ReviewTheme } from "@/components/review-poster";

const PLATFORMS: ReviewPlatform[] = ["google", "yelp", "facebook", "tripadvisor", "other"];
const THEMES: ReviewTheme[] = ["light", "dark"];
const PAPERS: PaperSize[] = ["4x6", "5x7", "half-letter", "8x10", "letter", "11x14", "tabloid"];

// A review link is pasted from somewhere else, so it arrives in whatever shape
// the source gave it. Accepting a bare domain and adding the scheme avoids a
// poster whose QR code resolves to nothing, which would only be discovered
// after printing a stack of them.
function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function saveReviewPoster(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard/signage");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", user!.id)
    .single();

  if (!business) {
    redirect("/dashboard/signage?error=" + encodeURIComponent("Business not found."));
  }

  const rawUrl = String(formData.get("reviewUrl") || "");
  const reviewUrl = normalizeUrl(rawUrl);

  // The link is the whole point of the poster, so saving without one is not a
  // valid state to persist. Reporting "Poster saved" for a poster whose QR
  // code goes nowhere is worse than refusing.
  if (!rawUrl.trim()) {
    redirect(
      "/dashboard/signage?error=" +
        encodeURIComponent("Add a review link first. The poster's QR code needs somewhere to send people."),
    );
  }

  if (!reviewUrl) {
    redirect(
      "/dashboard/signage?error=" +
        encodeURIComponent("That doesn't look like a valid link. Paste the full web address."),
    );
  }

  const platform = String(formData.get("platform") || "google") as ReviewPlatform;
  const theme = String(formData.get("theme") || "light") as ReviewTheme;
  const paper = String(formData.get("paper") || "letter") as PaperSize;

  const { error } = await supabase
    .from("businesses")
    .update({
      review_url: reviewUrl,
      review_platform: PLATFORMS.includes(platform) ? platform : "google",
      review_theme: THEMES.includes(theme) ? theme : "light",
      review_paper: PAPERS.includes(paper) ? paper : "letter",
      review_headline: String(formData.get("headline") || "").trim() || null,
      review_cta: String(formData.get("cta") || "").trim() || null,
      review_footer: String(formData.get("footer") || "").trim() || null,
      review_show_stars: formData.get("showStars") === "on",
    })
    .eq("id", business!.id);

  if (error) {
    redirect("/dashboard/signage?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/dashboard/signage");
  redirect("/dashboard/signage?saved=1");
}
