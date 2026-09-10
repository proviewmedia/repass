"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listCustomers, type PosConnectionRow } from "@/lib/square";

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

export async function importSquareCustomers() {
  const supabase = await createClient();
  const businessId = await getOwnedBusinessId(supabase);

  const { data: connection } = await supabase
    .from("pos_connections")
    .select("id, business_id, external_merchant_id, access_token, refresh_token, token_expires_at")
    .eq("business_id", businessId)
    .eq("provider", "square")
    .is("disconnected_at", null)
    .maybeSingle<PosConnectionRow>();

  if (!connection) {
    redirect("/dashboard/settings/connections?error=Connect Square first.");
  }

  const { data: existingCustomers } = await supabase
    .from("customers")
    .select("email")
    .eq("business_id", businessId)
    .is("removed_at", null);

  const existingEmails = new Set((existingCustomers || []).map((c) => (c.email || "").toLowerCase()).filter(Boolean));

  let squareCustomers;
  try {
    squareCustomers = await listCustomers(connection!);
  } catch (err) {
    console.error("Failed to list Square customers", err);
    redirect("/dashboard/settings/connections?error=Couldn't read customers from Square. Please try again.");
  }

  let imported = 0;
  let skipped = 0;

  for (const sc of squareCustomers!) {
    const email = sc.email?.trim().toLowerCase();
    if (!email) {
      skipped++;
      continue;
    }
    if (existingEmails.has(email)) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from("customers").insert({
      business_id: businessId,
      first_name: sc.firstName || email.split("@")[0],
      last_name: sc.lastName,
      email,
      phone: sc.phone,
      points_balance: 0,
      last_notification: " ",
    });

    if (error) {
      console.error("Failed to import Square customer", error);
      skipped++;
      continue;
    }

    existingEmails.add(email);
    imported++;
  }

  redirect(`/dashboard/settings/connections?imported=${imported}&skipped=${skipped}`);
}
