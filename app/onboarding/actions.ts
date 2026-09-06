"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const COLOR_PRESETS = ["dark", "blue", "green", "red", "purple", "orange"];

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createBusiness(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/onboarding");
  }

  const name = String(formData.get("name") || "").trim();
  const slugInput = String(formData.get("slug") || "").trim();
  const slug = slugify(slugInput || name);
  const colorPreset = COLOR_PRESETS.includes(String(formData.get("colorPreset")))
    ? String(formData.get("colorPreset"))
    : "dark";
  const pointsPerAction = Math.max(1, parseInt(String(formData.get("pointsPerAction") || "1"), 10) || 1);
  const rewardThreshold = Math.min(14, Math.max(1, parseInt(String(formData.get("rewardThreshold") || "10"), 10) || 10));
  const rewardDescription = String(formData.get("rewardDescription") || "A free reward").trim();

  if (!name || !slug) {
    redirect(`/onboarding?error=${encodeURIComponent("Business name is required.")}`);
  }

  const { data: business, error } = await supabase
    .from("businesses")
    .insert({
      owner_user_id: user!.id,
      name,
      slug,
      program_name: name,
      color_preset: colorPreset,
      points_per_action: pointsPerAction,
      reward_threshold: rewardThreshold,
      reward_description: rewardDescription,
    })
    .select("id")
    .single();

  if (error) {
    const message = error.code === "23505" ? "That URL is already taken — try another." : error.message;
    redirect(`/onboarding?error=${encodeURIComponent(message)}`);
  }

  redirect(`/api/stripe/checkout?businessId=${business!.id}`);
}
