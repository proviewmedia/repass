"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { disconnectStripeAccount, listStripeCustomers, type StripeConnectionRow } from "@/lib/stripe-connect";

export async function disconnectSquare() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard/settings/connections");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", user!.id)
    .single();

  if (!business) {
    redirect("/onboarding");
  }

  await supabase
    .from("pos_connections")
    .update({ disconnected_at: new Date().toISOString() })
    .eq("business_id", business!.id)
    .eq("provider", "square");

  redirect("/dashboard/settings/connections?disconnected=square");
}

async function getOwnedBusinessId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard/settings/connections");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", user!.id)
    .single();

  if (!business) {
    redirect("/onboarding");
  }

  return business!.id as string;
}

export async function disconnectStripe() {
  const supabase = await createClient();
  const businessId = await getOwnedBusinessId(supabase);

  const { data: connection } = await supabase
    .from("stripe_connections")
    .select("stripe_account_id")
    .eq("business_id", businessId)
    .is("disconnected_at", null)
    .maybeSingle();

  if (connection) {
    await disconnectStripeAccount(connection.stripe_account_id).catch((err) =>
      console.error("Failed to deauthorize Stripe connection", err),
    );
  }

  await supabase
    .from("stripe_connections")
    .update({ disconnected_at: new Date().toISOString() })
    .eq("business_id", businessId);

  redirect("/dashboard/settings/connections?disconnected=stripe");
}

function splitName(name: string | null, email: string): { firstName: string; lastName: string | null } {
  const trimmed = (name || "").trim();
  if (!trimmed) {
    return { firstName: email.split("@")[0], lastName: null };
  }
  const [firstName, ...rest] = trimmed.split(/\s+/);
  return { firstName, lastName: rest.length > 0 ? rest.join(" ") : null };
}

export async function importStripeCustomers() {
  const supabase = await createClient();
  const businessId = await getOwnedBusinessId(supabase);

  const { data: connection } = await supabase
    .from("stripe_connections")
    .select("id, business_id, stripe_account_id, access_token")
    .eq("business_id", businessId)
    .is("disconnected_at", null)
    .maybeSingle<StripeConnectionRow>();

  if (!connection) {
    redirect("/dashboard/settings/connections?error=Connect Stripe first.");
  }

  const { data: existingCustomers } = await supabase
    .from("customers")
    .select("email")
    .eq("business_id", businessId)
    .is("removed_at", null);

  const existingEmails = new Set((existingCustomers || []).map((c) => (c.email || "").toLowerCase()).filter(Boolean));

  let stripeCustomers;
  try {
    stripeCustomers = await listStripeCustomers(connection!);
  } catch (err) {
    console.error("Failed to list Stripe customers", err);
    redirect("/dashboard/settings/connections?error=Couldn't read customers from Stripe. Please try again.");
  }

  let imported = 0;
  let skipped = 0;

  for (const sc of stripeCustomers!) {
    const email = sc.email?.trim().toLowerCase();
    if (!email) {
      skipped++;
      continue;
    }
    if (existingEmails.has(email)) {
      skipped++;
      continue;
    }

    const { firstName, lastName } = splitName(sc.name, email);
    const { error } = await supabase.from("customers").insert({
      business_id: businessId,
      first_name: firstName,
      last_name: lastName,
      email,
      phone: sc.phone,
      points_balance: 0,
      last_notification: " ",
    });

    if (error) {
      console.error("Failed to import Stripe customer", error);
      skipped++;
      continue;
    }

    existingEmails.add(email);
    imported++;
  }

  redirect(`/dashboard/settings/connections?imported=${imported}&skipped=${skipped}`);
}
