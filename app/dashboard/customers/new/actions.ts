"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BUSINESS_BRANDING_COLUMNS } from "@/lib/wallet";
import { provisionCustomerPass } from "@/lib/customer-provisioning";
import { sendWalletLinkEmail } from "@/lib/resend";

export async function addCustomer(formData: FormData) {
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  if (!firstName || !lastName) {
    redirect(`/dashboard/customers/new?error=${encodeURIComponent("First and last name are required.")}`);
  }
  if (!email || !email.includes("@")) {
    redirect(`/dashboard/customers/new?error=${encodeURIComponent("A valid email is required.")}`);
  }
  if (!phone) {
    redirect(`/dashboard/customers/new?error=${encodeURIComponent("Phone number is required.")}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard/customers/new");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select(`id, ${BUSINESS_BRANDING_COLUMNS}`)
    .eq("owner_user_id", user!.id)
    .single();

  if (!business) {
    redirect("/onboarding");
  }

  let provisioned;
  try {
    provisioned = await provisionCustomerPass({ supabase, business: business!, firstName, lastName, email, phone });
  } catch {
    redirect(`/dashboard/customers/new?error=${encodeURIComponent("Couldn't create their card right now — please try again.")}`);
  }

  await sendWalletLinkEmail(email, business!.name, provisioned!.shareUrl).catch((err) =>
    console.error("Failed to send wallet link email", err),
  );

  redirect("/dashboard/customers?added=1");
}
