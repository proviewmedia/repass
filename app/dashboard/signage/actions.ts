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

export interface SaveResult {
  ok: boolean;
  error?: string;
}

/**
 * Writes the settings and returns the outcome instead of redirecting.
 *
 * "Save and print" has to open the print view in a new tab, and a tab can only
 * be opened from inside the click that the user actually made. A server
 * redirect would move the current tab instead, throwing them out of the
 * dashboard. So the client opens the tab synchronously, awaits this, then
 * points the tab at the print view.
 */
export async function persistReviewPoster(formData: FormData): Promise<SaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Your session expired. Reload the page and sign in again." };
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();

  if (!business) {
    return { ok: false, error: "Business not found." };
  }

  const rawUrl = String(formData.get("reviewUrl") || "");
  if (!rawUrl.trim()) {
    return { ok: false, error: "Add a review link first. The poster's QR code needs somewhere to send people." };
  }

  const reviewUrl = normalizeUrl(rawUrl);
  if (!reviewUrl) {
    return { ok: false, error: "That doesn't look like a valid link. Paste the full web address." };
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
    .eq("id", business.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/signage");
  return { ok: true };
}

/** Form-action wrapper for "Save settings only", which stays on this page. */
export async function saveReviewPoster(formData: FormData) {
  const result = await persistReviewPoster(formData);

  if (!result.ok) {
    redirect("/dashboard/signage?error=" + encodeURIComponent(result.error || "Could not save."));
  }

  redirect("/dashboard/signage?saved=1");
}
