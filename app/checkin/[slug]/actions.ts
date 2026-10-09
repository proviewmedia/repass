"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { awardPoints } from "@/lib/points";
import { checkinCookieName, CHECKIN_COOLDOWN_MS } from "@/lib/checkin";
import { normalizePhone } from "@/lib/pos-matching";
import { sendWalletLinkEmail } from "@/lib/resend";

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

  // Matched on the normalized number, not the raw string: a customer typing
  // "(401) 555-1234" here has no idea the business imported them from a POS as
  // "+14015551234", and an exact compare would tell them no card exists.
  const normalized = normalizePhone(phone);
  const { data: matches } = normalized
    ? await supabase
        .from("customers")
        .select("id")
        .eq("business_id", business!.id)
        .eq("phone_normalized", normalized)
        .is("removed_at", null)
        .order("created_at", { ascending: true })
    : { data: null };

  const customer = matches?.[0] ?? null;

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

// Self-service recovery: a customer who deleted their pass or changed phones
// gets the link emailed to themselves, without asking staff. Nothing is
// reissued, so their points are untouched.
//
// Unlike linkByPhone above, this reports the same message whether or not the
// number is enrolled. Emailing a wallet link is an action with a side effect
// on someone else's inbox, so it shouldn't double as a way for a stranger to
// test which phone numbers belong to a business's customers.
export async function emailMyCard(slug: string, formData: FormData) {
  const phone = String(formData.get("phone") || "").trim();
  const neutral = `/checkin/${slug}?emailed=1`;

  if (!phone) {
    redirect(`/checkin/${slug}?error=${encodeURIComponent("Enter the phone number you signed up with.")}`);
  }

  const supabase = createAdminClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, subscription_status")
    .eq("slug", slug)
    .single();

  if (!business || business.subscription_status !== "active") {
    redirect(`/checkin/${slug}?error=${encodeURIComponent("This program isn't accepting check-ins right now.")}`);
  }

  const normalized = normalizePhone(phone);
  if (!normalized) {
    redirect(neutral);
  }

  const { data: matches } = await supabase
    .from("customers")
    .select("email, share_url")
    .eq("business_id", business!.id)
    .eq("phone_normalized", normalized)
    .is("removed_at", null)
    .order("created_at", { ascending: true });

  const customer = matches?.[0];

  if (customer?.email && customer.share_url) {
    try {
      await sendWalletLinkEmail(customer.email, business!.name, customer.share_url);
    } catch (err) {
      console.error(`Failed to email wallet link for business ${business!.id}`, err);
    }
  }

  redirect(neutral);
}
