"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createDiscount, type PosConnectionRow } from "@/lib/square";

async function requireBusiness() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard/settings/rewards");
  }

  const { data: business } = await supabase.from("businesses").select("id").eq("owner_user_id", user!.id).single();

  if (!business) {
    redirect("/onboarding");
  }

  return { supabase, business: business! };
}

async function resolveSquareDiscountId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
  formData: FormData,
): Promise<string | null> {
  const mode = String(formData.get("discountMode") || "");
  if (mode === "existing") {
    const id = String(formData.get("existingDiscountId") || "").trim();
    return id || null;
  }
  if (mode === "new") {
    const name = String(formData.get("newDiscountName") || "").trim();
    if (!name) throw new Error("Discount name is required.");
    const kind = formData.get("newDiscountKind") === "fixed_percentage" ? "fixed_percentage" : "fixed_amount";

    const { data: connection } = await supabase
      .from("pos_connections")
      .select("id, business_id, external_merchant_id, access_token, refresh_token, token_expires_at")
      .eq("business_id", businessId)
      .eq("provider", "square")
      .is("disconnected_at", null)
      .single<PosConnectionRow>();

    if (!connection) throw new Error("Connect Square before creating a discount.");

    const created = await createDiscount(connection, {
      name,
      kind,
      amountCents:
        kind === "fixed_amount" ? Math.round(parseFloat(String(formData.get("newDiscountAmount") || "0")) * 100) : undefined,
      percentage: kind === "fixed_percentage" ? String(formData.get("newDiscountPercentage") || "100") : undefined,
    });
    return created.id;
  }
  return null;
}

export async function createRewardTier(formData: FormData) {
  const { supabase, business } = await requireBusiness();

  const label = String(formData.get("label") || "").trim();
  const pointsCost = Math.max(1, parseInt(String(formData.get("pointsCost") || "0"), 10) || 0);

  if (!label) {
    redirect(`/dashboard/settings/rewards?error=${encodeURIComponent("A reward name is required.")}`);
  }
  if (!pointsCost) {
    redirect(`/dashboard/settings/rewards?error=${encodeURIComponent("Points cost must be at least 1.")}`);
  }

  let squareDiscountId: string | null;
  try {
    squareDiscountId = await resolveSquareDiscountId(supabase, business.id, formData);
  } catch (err) {
    redirect(`/dashboard/settings/rewards?error=${encodeURIComponent((err as Error).message)}`);
  }

  const { error } = await supabase.from("reward_tiers").insert({
    business_id: business.id,
    label,
    points_cost: pointsCost,
    square_discount_id: squareDiscountId!,
  });

  if (error) {
    redirect(`/dashboard/settings/rewards?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/settings/rewards");
  redirect("/dashboard/settings/rewards?saved=1");
}

export async function updateRewardTier(tierId: string, formData: FormData) {
  const { supabase, business } = await requireBusiness();

  const label = String(formData.get("label") || "").trim();
  const pointsCost = Math.max(1, parseInt(String(formData.get("pointsCost") || "0"), 10) || 0);

  if (!label || !pointsCost) {
    redirect(`/dashboard/settings/rewards?error=${encodeURIComponent("A reward needs a name and a points cost.")}`);
  }

  const { error } = await supabase
    .from("reward_tiers")
    .update({ label, points_cost: pointsCost })
    .eq("id", tierId)
    .eq("business_id", business.id);

  if (error) {
    redirect(`/dashboard/settings/rewards?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/settings/rewards");
  redirect("/dashboard/settings/rewards?saved=1");
}

export async function archiveRewardTier(tierId: string) {
  const { supabase, business } = await requireBusiness();

  await supabase
    .from("reward_tiers")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", tierId)
    .eq("business_id", business.id);

  revalidatePath("/dashboard/settings/rewards");
  redirect("/dashboard/settings/rewards?saved=1");
}

export async function linkTierToDiscount(tierId: string, formData: FormData) {
  const { supabase, business } = await requireBusiness();

  let squareDiscountId: string | null;
  try {
    squareDiscountId = await resolveSquareDiscountId(supabase, business.id, formData);
  } catch (err) {
    redirect(`/dashboard/settings/rewards?error=${encodeURIComponent((err as Error).message)}`);
  }

  if (!squareDiscountId) {
    redirect(`/dashboard/settings/rewards?error=${encodeURIComponent("Pick or create a discount to link.")}`);
  }

  const { error } = await supabase
    .from("reward_tiers")
    .update({ square_discount_id: squareDiscountId })
    .eq("id", tierId)
    .eq("business_id", business.id);

  if (error) {
    const message = error.code === "23505" ? "That discount is already linked to another reward." : error.message;
    redirect(`/dashboard/settings/rewards?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/dashboard/settings/rewards");
  redirect("/dashboard/settings/rewards?saved=1");
}
