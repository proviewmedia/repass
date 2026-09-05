"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPass } from "@/lib/wallet";

export async function joinProgram(slug: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  if (!name) {
    redirect(`/join/${slug}?error=${encodeURIComponent("Your name is required.")}`);
  }

  const supabase = createAdminClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, program_name, color_preset, logo_url, subscription_status")
    .eq("slug", slug)
    .single();

  if (!business || business.subscription_status !== "active") {
    redirect(`/join/${slug}?error=${encodeURIComponent("This program isn't accepting new members right now.")}`);
  }

  const customerId = randomUUID();
  const NOT_STARTED = " ";

  let pass;
  try {
    pass = await createPass(
      {
        name: business!.name,
        programName: business!.program_name,
        colorPreset: business!.color_preset,
        logoUrl: business!.logo_url,
      },
      { id: customerId, pointsBalance: 0, notification: NOT_STARTED },
    );
  } catch {
    redirect(`/join/${slug}?error=${encodeURIComponent("Couldn't create your card right now — please try again.")}`);
  }

  const { error: insertError } = await supabase.from("customers").insert({
    id: customerId,
    business_id: business!.id,
    name,
    email: email || null,
    phone: phone || null,
    points_balance: 0,
    walletwallet_serial: pass.serialNumber,
    share_url: pass.shareUrl,
    google_save_url: pass.googleSaveUrl,
    last_notification: NOT_STARTED,
  });

  if (insertError) {
    redirect(`/join/${slug}?error=${encodeURIComponent("Something went wrong saving your details — please try again.")}`);
  }

  redirect(`/join/${slug}/success?shareUrl=${encodeURIComponent(pass.shareUrl)}&name=${encodeURIComponent(name)}`);
}
