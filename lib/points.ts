import type { SupabaseClient } from "@supabase/supabase-js";
import { BUSINESS_BRANDING_COLUMNS, toPassBusinessInput, updatePass } from "@/lib/wallet";

export type PointSource = "manual" | "checkin" | "square" | "toast";

export interface AwardPointsParams {
  supabase: SupabaseClient;
  customerId: string;
  businessId: string;
  source: PointSource;
  /** External id (e.g. a Square payment id) to dedupe retried webhook deliveries. */
  externalEventId?: string | null;
  /** Extra columns to merge into the same customers update (e.g. last_checkin_at). */
  extraCustomerFields?: Record<string, unknown>;
}

export interface AwardPointsResult {
  status: "awarded" | "duplicate";
  newBalance: number;
  crossedReward: boolean;
}

// Shared by every point-earning path (owner "Add a point" click, self-checkin QR
// scan, and POS webhooks): increments the balance, logs the event, and pushes the
// updated pass to the customer's wallet, firing a reward-unlock notification if the
// customer just crossed a threshold. `externalEventId` makes this safe to call
// multiple times for the same real-world event — a retried webhook is a no-op.
export async function awardPoints({
  supabase,
  customerId,
  businessId,
  source,
  externalEventId,
  extraCustomerFields,
}: AwardPointsParams): Promise<AwardPointsResult> {
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, points_balance, last_notification, walletwallet_serial")
    .eq("id", customerId)
    .eq("business_id", businessId)
    .single();

  if (customerError || !customer) {
    throw new Error("Customer not found");
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select(`points_per_action, ${BUSINESS_BRANDING_COLUMNS}`)
    .eq("id", businessId)
    .single();

  if (businessError || !business) {
    throw new Error("Business not found");
  }

  const oldBalance = customer.points_balance;
  const newBalance = oldBalance + business.points_per_action;
  const crossedReward =
    Math.floor(oldBalance / business.reward_threshold) < Math.floor(newBalance / business.reward_threshold);

  // Insert the ledger row first — a plain insert (never upsert/onConflict, which
  // can't target a partial unique index) so a duplicate externalEventId hits the
  // partial unique index on (business_id, external_event_id) and 23505s. That
  // failure means this exact event was already processed: stop before touching the
  // balance or the wallet pass, so a retried webhook can't double-award.
  const { error: eventError } = await supabase.from("point_events").insert({
    customer_id: customerId,
    business_id: businessId,
    delta: business.points_per_action,
    resulting_balance: newBalance,
    source,
    external_event_id: externalEventId ?? null,
  });

  if (eventError) {
    if (eventError.code === "23505") {
      return { status: "duplicate", newBalance: oldBalance, crossedReward: false };
    }
    throw new Error(`Failed to record point event: ${eventError.message}`);
  }

  await supabase
    .from("customers")
    .update({ points_balance: newBalance, ...extraCustomerFields })
    .eq("id", customerId);

  const branding = toPassBusinessInput(business);

  if (customer.walletwallet_serial) {
    await updatePass(customer.walletwallet_serial, branding, {
      id: customerId,
      pointsBalance: newBalance,
      notification: customer.last_notification,
    });

    if (crossedReward) {
      const message = `🎉 Reward unlocked: ${business.reward_description}!`;
      await updatePass(customer.walletwallet_serial, branding, {
        id: customerId,
        pointsBalance: newBalance,
        notification: message,
      });
      await supabase.from("customers").update({ last_notification: message }).eq("id", customerId);
    }
  }

  return { status: "awarded", newBalance, crossedReward };
}
