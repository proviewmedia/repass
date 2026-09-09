"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { awardPoints } from "@/lib/points";
import { checkinCookieName, CHECKIN_COOLDOWN_MS } from "@/lib/checkin";

export async function checkIn(slug: string, customerId: string) {
  const supabase = createAdminClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, subscription_status")
    .eq("slug", slug)
    .single();

  if (!business || business.subscription_status !== "active") {
    redirect(`/checkin/${slug}?error=${encodeURIComponent("This program isn't accepting check-ins right now.")}`);
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id, last_checkin_at")
    .eq("id", customerId)
    .eq("business_id", business!.id)
    .is("removed_at", null)
    .single();

  if (!customer) {
    redirect(`/checkin/${slug}?error=${encodeURIComponent("We couldn't find your card on this phone.")}`);
  }

  if (customer!.last_checkin_at) {
    const sinceMs = Date.now() - new Date(customer!.last_checkin_at).getTime();
    if (sinceMs < CHECKIN_COOLDOWN_MS) {
      redirect(`/checkin/${slug}?alreadyCheckedIn=1`);
    }
  }

  const { newBalance } = await awardPoints({
    supabase,
    customerId,
    businessId: business!.id,
    source: "checkin",
    extraCustomerFields: { last_checkin_at: new Date().toISOString() },
  });

  redirect(`/checkin/${slug}?success=1&points=${newBalance}`);
}

export async function linkByPhone(slug: string, formData: FormData) {
  const phone = String(formData.get("phone") || "").trim();

  if (!phone) {
    redirect(`/checkin/${slug}?error=${encodeURIComponent("Enter the phone number you signed up with.")}`);
  }

  const supabase = createAdminClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id, subscription_status")
    .eq("slug", slug)
    .single();

  if (!business || business.subscription_status !== "active") {
    redirect(`/checkin/${slug}?error=${encodeURIComponent("This program isn't accepting check-ins right now.")}`);
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("business_id", business!.id)
    .eq("phone", phone)
    .is("removed_at", null)
    .single();

  if (!customer) {
    redirect(
      `/checkin/${slug}?error=${encodeURIComponent("No card found with that phone number — ask staff for help, or join the program if you're new.")}`,
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(checkinCookieName(business!.id), customer!.id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect(`/checkin/${slug}`);
}
