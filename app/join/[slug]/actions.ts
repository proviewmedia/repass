"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUSINESS_BRANDING_COLUMNS } from "@/lib/wallet";
import { provisionCustomerPass } from "@/lib/customer-provisioning";
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

  let provisioned;
  try {
    provisioned = await provisionCustomerPass({ supabase, business: business!, firstName, lastName, email, phone });
  } catch {
    redirect(`/join/${slug}?error=${encodeURIComponent("Couldn't create your card right now — please try again.")}`);
  }

  const { customerId, shareUrl } = provisioned!;

  await sendWalletLinkEmail(email, business!.name, shareUrl).catch((err) =>
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

  redirect(`/join/${slug}/success?shareUrl=${encodeURIComponent(shareUrl)}&name=${encodeURIComponent(firstName)}`);
}
