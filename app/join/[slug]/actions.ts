"use server";

import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUSINESS_BRANDING_COLUMNS, createPass, toPassBusinessInput } from "@/lib/wallet";
import { sendWalletLinkEmail } from "@/lib/resend";
import { checkinCookieName } from "@/lib/checkin";

export async function joinProgram(slug: string, formData: FormData) {
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  if (!firstName || !lastName) {
    redirect(`/join/${slug}?error=${encodeURIComponent("First and last name are required.")}`);
  }
  if (!email || !email.includes("@")) {
    redirect(`/join/${slug}?error=${encodeURIComponent("A valid email is required.")}`);
  }
  if (!phone) {
    redirect(`/join/${slug}?error=${encodeURIComponent("Phone number is required.")}`);
  }

  const supabase = createAdminClient();
  const { data: business } = await supabase
    .from("businesses")
    .select(`id, subscription_status, ${BUSINESS_BRANDING_COLUMNS}`)
    .eq("slug", slug)
    .single();

  if (!business || business.subscription_status !== "active") {
    redirect(`/join/${slug}?error=${encodeURIComponent("This program isn't accepting new members right now.")}`);
  }

  const NOT_STARTED = " ";

  // A Stripe-imported (or otherwise pre-seeded) customer has a row with no
  // wallet pass yet. If this email matches one, claim that row instead of
  // creating a duplicate — carrying over any points it already has.
  const { data: existing } = await supabase
    .from("customers")
    .select("id, points_balance")
    .eq("business_id", business!.id)
    .eq("email", email)
    .is("removed_at", null)
    .is("walletwallet_serial", null)
    .maybeSingle();

  const customerId = existing?.id ?? randomUUID();
  const startingBalance = existing?.points_balance ?? 0;

  let pass;
  try {
    pass = await createPass(toPassBusinessInput(business!), {
      id: customerId,
      pointsBalance: startingBalance,
      notification: NOT_STARTED,
    });
  } catch {
    redirect(`/join/${slug}?error=${encodeURIComponent("Couldn't create your card right now — please try again.")}`);
  }

  const customerFields = {
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    walletwallet_serial: pass.serialNumber,
    share_url: pass.shareUrl,
    google_save_url: pass.googleSaveUrl,
    last_notification: NOT_STARTED,
  };

  const { error: writeError } = existing
    ? await supabase.from("customers").update(customerFields).eq("id", existing.id)
    : await supabase.from("customers").insert({
        id: customerId,
        business_id: business!.id,
        points_balance: startingBalance,
        ...customerFields,
      });

  if (writeError) {
    redirect(`/join/${slug}?error=${encodeURIComponent("Something went wrong saving your details — please try again.")}`);
  }

  await sendWalletLinkEmail(email, business!.name, pass.shareUrl).catch((err) =>
    console.error("Failed to send wallet link email", err),
  );

  const cookieStore = await cookies();
  cookieStore.set(checkinCookieName(business!.id), customerId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect(`/join/${slug}/success?shareUrl=${encodeURIComponent(pass.shareUrl)}&name=${encodeURIComponent(firstName)}`);
}
