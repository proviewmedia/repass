"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPass, isCustomHexColor, updatePass } from "@/lib/wallet";

const COLOR_PRESETS = ["dark", "blue", "green", "red", "purple", "orange"];
const IMAGE_MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

async function uploadImage(file: File, businessId: string, slot: string): Promise<string> {
  const ext = IMAGE_MIME_EXT[file.type];
  if (!ext) {
    throw new Error(`${slot} image must be a PNG, JPEG, WebP, or SVG image.`);
  }
  const path = `${businessId}-${slot}-${Date.now()}.${ext}`;
  const admin = createAdminClient();
  const { error } = await admin.storage.from("logos").upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    throw new Error(`${slot} image upload failed: ${error.message}`);
  }
  return admin.storage.from("logos").getPublicUrl(path).data.publicUrl;
}

// Resolves one optional image field from the submitted form: removed, replaced with a
// newly uploaded file, or left as whatever the business already had.
async function resolveImageField(
  formData: FormData,
  fieldName: string,
  removeFieldName: string,
  currentUrl: string | null,
  businessId: string,
): Promise<string | null> {
  if (formData.get(removeFieldName) === "1") return null;
  const file = formData.get(fieldName);
  if (file instanceof File && file.size > 0) {
    return uploadImage(file, businessId, fieldName);
  }
  return currentUrl;
}

function parseBrandingFields(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const programName = String(formData.get("programName") || "").trim() || name;
  const rawColor = String(formData.get("colorPreset") || "");
  const colorPreset = COLOR_PRESETS.includes(rawColor) || isCustomHexColor(rawColor) ? rawColor : "dark";
  const rewardThreshold = Math.min(14, Math.max(1, parseInt(String(formData.get("rewardThreshold") || "10"), 10) || 10));
  const rewardDescription = String(formData.get("rewardDescription") || "A free reward").trim();
  const sharingProhibited = formData.get("allowSharing") !== "1";
  return { name, programName, colorPreset, rewardThreshold, rewardDescription, sharingProhibited };
}

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
    .select("id, logo_url, wide_logo_url, icon_url, thumbnail_url, strip_url")
    .eq("owner_user_id", user!.id)
    .single();

  if (!business) {
    redirect("/onboarding");
  }

  const { name, programName, colorPreset, rewardThreshold, rewardDescription, sharingProhibited } =
    parseBrandingFields(formData);
  const pointsPerAction = Math.max(1, parseInt(String(formData.get("pointsPerAction") || "1"), 10) || 1);

  if (!name) {
    redirect(`/dashboard/settings?error=${encodeURIComponent("Business name is required.")}`);
  }

  let logoUrl: string | null,
    wideLogoUrl: string | null,
    iconUrl: string | null,
    thumbnailUrl: string | null,
    stripUrl: string | null;
  try {
    logoUrl = await resolveImageField(formData, "logo", "removeLogo", business!.logo_url, business!.id);
    wideLogoUrl = await resolveImageField(formData, "wideLogo", "removeWideLogo", business!.wide_logo_url, business!.id);
    iconUrl = await resolveImageField(formData, "icon", "removeIcon", business!.icon_url, business!.id);
    thumbnailUrl = await resolveImageField(
      formData,
      "thumbnail",
      "removeThumbnail",
      business!.thumbnail_url,
      business!.id,
    );
    stripUrl = await resolveImageField(formData, "strip", "removeStrip", business!.strip_url, business!.id);
  } catch (err) {
    redirect(`/dashboard/settings?error=${encodeURIComponent((err as Error).message)}`);
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      name,
      program_name: programName,
      color_preset: colorPreset,
      logo_url: logoUrl!,
      wide_logo_url: wideLogoUrl!,
      icon_url: iconUrl!,
      thumbnail_url: thumbnailUrl!,
      strip_url: stripUrl!,
      sharing_prohibited: sharingProhibited,
      points_per_action: pointsPerAction,
      reward_threshold: rewardThreshold,
      reward_description: rewardDescription,
    })
    .eq("id", business!.id);

  if (error) {
    redirect(`/dashboard/settings?error=${encodeURIComponent(error.message)}`);
  }

  // Card design lives on every issued pass — push the refreshed branding to
  // everyone. WalletWallet no-ops (no push, no quota cost) for anyone whose card
  // body didn't actually change.
  const { data: customers } = await supabase
    .from("customers")
    .select("id, points_balance, last_notification, walletwallet_serial")
    .eq("business_id", business!.id)
    .is("removed_at", null)
    .not("walletwallet_serial", "is", null);

  const branding = {
    name,
    programName,
    colorPreset,
    logoUrl,
    wideLogoUrl,
    iconUrl,
    thumbnailUrl,
    stripUrl,
    sharingProhibited,
    rewardThreshold,
    rewardDescription,
  };
  for (const customer of customers || []) {
    await updatePass(customer.walletwallet_serial!, branding, {
      id: customer.id,
      pointsBalance: customer.points_balance,
      notification: customer.last_notification,
    }).catch((err) => console.error(`Failed to refresh pass for customer ${customer.id}`, err));
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  redirect("/dashboard/settings?saved=1");
}

// Generates/refreshes a real, non-customer preview pass against the current
// (possibly unsaved) form values, so a business can scan a real QR and see the
// actual WalletWallet rendering on their own phone — ground truth, not a mockup.
export async function previewCard(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard/settings");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, preview_serial, logo_url, wide_logo_url, icon_url, thumbnail_url, strip_url")
    .eq("owner_user_id", user!.id)
    .single();

  if (!business) {
    redirect("/onboarding");
  }

  const { name, programName, colorPreset, rewardThreshold, rewardDescription, sharingProhibited } =
    parseBrandingFields(formData);

  let logoUrl: string | null,
    wideLogoUrl: string | null,
    iconUrl: string | null,
    thumbnailUrl: string | null,
    stripUrl: string | null;
  try {
    logoUrl = await resolveImageField(formData, "logo", "removeLogo", business!.logo_url, business!.id);
    wideLogoUrl = await resolveImageField(formData, "wideLogo", "removeWideLogo", business!.wide_logo_url, business!.id);
    iconUrl = await resolveImageField(formData, "icon", "removeIcon", business!.icon_url, business!.id);
    thumbnailUrl = await resolveImageField(
      formData,
      "thumbnail",
      "removeThumbnail",
      business!.thumbnail_url,
      business!.id,
    );
    stripUrl = await resolveImageField(formData, "strip", "removeStrip", business!.strip_url, business!.id);
  } catch (err) {
    redirect(`/dashboard/settings?error=${encodeURIComponent((err as Error).message)}`);
  }

  const branding = {
    name,
    programName,
    colorPreset,
    logoUrl,
    wideLogoUrl,
    iconUrl,
    thumbnailUrl,
    stripUrl,
    sharingProhibited,
    rewardThreshold,
    rewardDescription,
  };
  const previewCustomer = { id: `preview-${business!.id}`, pointsBalance: 3, notification: " " };

  let serial = business!.preview_serial;
  try {
    if (serial) {
      await updatePass(serial, branding, previewCustomer);
    } else {
      const created = await createPass(branding, previewCustomer);
      serial = created.serialNumber;
      await supabase.from("businesses").update({ preview_serial: serial }).eq("id", business!.id);
    }
  } catch (err) {
    redirect(`/dashboard/settings?error=${encodeURIComponent("Preview failed: " + (err as Error).message)}`);
  }

  redirect(`/dashboard/settings?previewUrl=${encodeURIComponent(`https://api.walletwallet.dev/p/${serial}`)}`);
}
