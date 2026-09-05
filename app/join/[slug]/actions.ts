"use server";

import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPass } from "@/lib/wallet";
import { sendWalletLinkEmail } from "@/lib/resend";
import { checkinCookieName } from "@/lib/checkin";

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
    .select("id, name, program_name, color_preset, logo_url, reward_threshold, reward_description, subscription_status")
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
        rewardThreshold: business!.reward_threshold,
        rewardDescription: business!.reward_description,
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

  if (email) {
    await sendWalletLinkEmail(email, business!.name, pass.shareUrl).catch((err) =>
      console.error("Failed to send wallet link email", err),
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(checkinCookieName(business!.id), customerId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect(`/join/${slug}/success?shareUrl=${encodeURIComponent(pass.shareUrl)}&name=${encodeURIComponent(name)}`);
}
