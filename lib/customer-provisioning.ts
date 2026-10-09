import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPass, toPassBusinessInput, type BusinessBrandingRow } from "@/lib/wallet";

export interface ProvisionCustomerParams {
  supabase: SupabaseClient;
  business: BusinessBrandingRow & { id: string; name: string };
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface ProvisionCustomerResult {
  customerId: string;
  shareUrl: string;
}

// Shared by the public join flow and the dashboard's manual "Add customer"
// action: if this email matches a dormant (no-pass) row — a Stripe import,
// or a previous partial attempt — claims it instead of creating a
// duplicate, carrying over any points it already has. Otherwise inserts a
// fresh row. Either way, issues a real wallet pass. Throws on failure —
// callers keep their own try/catch and page-appropriate error redirect.
export async function provisionCustomerPass({
  supabase,
  business,
  firstName,
  lastName,
  email,
  phone,
}: ProvisionCustomerParams): Promise<ProvisionCustomerResult> {
  const NOT_STARTED = " ";

  const { data: dormant } = await supabase
    .from("customers")
    .select("id, points_balance")
    .eq("business_id", business.id)
    .eq("email", email)
    .is("removed_at", null)
    .is("walletwallet_serial", null)
    .maybeSingle();

  // A previously removed customer is reclaimed too, not just a dormant one.
  // Without this, re-adding someone who was removed by mistake inserted a
  // brand new row and silently abandoned their points: the old row still
  // held the balance but nothing pointed at it any more. Their pass was
  // revoked at removal, so a fresh one gets issued below either way.
  let existing = dormant;
  if (!existing) {
    const { data: removed } = await supabase
      .from("customers")
      .select("id, points_balance")
      .eq("business_id", business.id)
      .eq("email", email)
      .not("removed_at", "is", null)
      .order("removed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    existing = removed;
  }

  const customerId = existing?.id ?? randomUUID();
  const startingBalance = existing?.points_balance ?? 0;

  const pass = await createPass(toPassBusinessInput(business), {
    id: customerId,
    pointsBalance: startingBalance,
    notification: NOT_STARTED,
  });

  const customerFields = {
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    walletwallet_serial: pass.serialNumber,
    share_url: pass.shareUrl,
    google_save_url: pass.googleSaveUrl,
    last_notification: NOT_STARTED,
    // Clears the flag when the row being claimed was a removed customer.
    removed_at: null,
  };

  const { error: writeError } = existing
    ? await supabase.from("customers").update(customerFields).eq("id", existing.id)
    : await supabase.from("customers").insert({
        id: customerId,
        business_id: business.id,
        points_balance: startingBalance,
        ...customerFields,
      });

  if (writeError) {
    throw new Error(writeError.message);
  }

  return { customerId, shareUrl: pass.shareUrl };
}
