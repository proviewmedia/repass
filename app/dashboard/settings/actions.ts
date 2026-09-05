"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePass } from "@/lib/wallet";

const COLOR_PRESETS = ["dark", "blue", "green", "red", "purple", "orange"];

export async function updateSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard/settings");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", user!.id)
    .single();

  if (!business) {
    redirect("/onboarding");
  }

  const name = String(formData.get("name") || "").trim();
  const programName = String(formData.get("programName") || "").trim() || name;
  const colorPreset = COLOR_PRESETS.includes(String(formData.get("colorPreset")))
    ? String(formData.get("colorPreset"))
    : "dark";
  const logoUrl = String(formData.get("logoUrl") || "").trim();
  const pointsPerAction = Math.max(1, parseInt(String(formData.get("pointsPerAction") || "1"), 10) || 1);
  const rewardThreshold = Math.max(1, parseInt(String(formData.get("rewardThreshold") || "10"), 10) || 10);
  const rewardDescription = String(formData.get("rewardDescription") || "A free reward").trim();

  if (!name) {
    redirect(`/dashboard/settings?error=${encodeURIComponent("Business name is required.")}`);
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      name,
      program_name: programName,
      color_preset: colorPreset,
      logo_url: logoUrl || null,
      points_per_action: pointsPerAction,
      reward_threshold: rewardThreshold,
      reward_description: rewardDescription,
    })
    .eq("id", business!.id);

  if (error) {
    redirect(`/dashboard/settings?error=${encodeURIComponent(error.message)}`);
  }

  // Card design (name/color/logo) lives on every issued pass — push the
  // refreshed branding to everyone. WalletWallet no-ops (no push, no quota
  // cost) for anyone whose card body didn't actually change.
  const { data: customers } = await supabase
    .from("customers")
    .select("id, points_balance, last_notification, walletwallet_serial")
    .eq("business_id", business!.id)
    .not("walletwallet_serial", "is", null);

  const branding = { name, programName, colorPreset, logoUrl: logoUrl || null };
  for (const customer of customers || []) {
    await updatePass(customer.walletwallet_serial!, branding, {
      id: customer.id,
      pointsBalance: customer.points_balance,
      notification: customer.last_notification,
    }).catch((err) => console.error(`Failed to refresh pass for customer ${customer.id}`, err));
  }

  redirect("/dashboard/settings?saved=1");
}
