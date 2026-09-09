import type { SupabaseClient } from "@supabase/supabase-js";
import { BUSINESS_BRANDING_COLUMNS, toPassBusinessInput, updatePass, type RewardTier } from "@/lib/wallet";

export type PointSource = "manual" | "checkin" | "square" | "toast";

export interface AwardPointsParams {
  supabase: SupabaseClient;
  customerId: string;
  businessId: string;
  source: PointSource;
  /**
   * Signed point delta. Omit to earn the business's default points_per_action
   * (every existing earn call site keeps this default). Pass a negative
   * number to redeem a reward tier.
   */
  delta?: number;
  /** External id (e.g. a Square payment id) to dedupe retried webhook deliveries. */
  externalEventId?: string | null;
  /** Extra columns to merge into the same customers update (e.g. last_checkin_at). */
  extraCustomerFields?: Record<string, unknown>;
}

interface NewlyReachedTier {
  id: string;
  pointsCost: number;
  label: string;
}

export interface AwardPointsResult {
  status: "awarded" | "duplicate";
  newBalance: number;
  /**
   * Active reward tiers newly crossed by this event (oldBalance < cost <=
   * newBalance). Always empty for redemptions — a decreasing balance can't
   * newly cross an upward threshold.
   */
  newlyReachedTiers: NewlyReachedTier[];
}

// Shared by every point-earning/redeeming path (owner "Add a point" click,
// self-checkin QR scan, and Square webhooks): applies a signed delta to the
// balance, logs the event, and pushes the updated pass to the customer's
// wallet, firing a reward-unlock notification if the customer just crossed a
// tier. `externalEventId` makes this safe to call multiple times for the same
// real-world event — a retried webhook is a no-op.
export async function awardPoints({
  supabase,
  customerId,
  businessId,
  source,
  delta,
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

  const { data: tierRows, error: tiersError } = await supabase
    .from("reward_tiers")
    .select("id, points_cost, label")
    .eq("business_id", businessId)
    .is("archived_at", null)
    .order("points_cost", { ascending: true });

  if (tiersError) {
    throw new Error(`Failed to load reward tiers: ${tiersError.message}`);
  }

  const tiers: RewardTier[] = (tierRows || []).map((t) => ({ pointsCost: t.points_cost, label: t.label }));

  const oldBalance = customer.points_balance;
  const appliedDelta = delta ?? business.points_per_action;
  const newBalance = oldBalance + appliedDelta;

  if (newBalance < 0) {
    throw new Error("Refusing to apply a point delta that would make the balance negative");
  }

  const newlyReachedTiers: NewlyReachedTier[] = (tierRows || [])
    .filter((t) => oldBalance < t.points_cost && t.points_cost <= newBalance)
    .sort((a, b) => a.points_cost - b.points_cost)
    .map((t) => ({ id: t.id, pointsCost: t.points_cost, label: t.label }));

  // Insert the ledger row first — a plain insert (never upsert/onConflict, which
  // can't target a partial unique index) so a duplicate externalEventId hits the
  // partial unique index on (business_id, external_event_id) and 23505s. That
  // failure means this exact event was already processed: stop before touching the
  // balance or the wallet pass, so a retried webhook can't double-apply.
  const { error: eventError } = await supabase.from("point_events").insert({
    customer_id: customerId,
    business_id: businessId,
    delta: appliedDelta,
    resulting_balance: newBalance,
    source,
    external_event_id: externalEventId ?? null,
  });

  if (eventError) {
    if (eventError.code === "23505") {
      return { status: "duplicate", newBalance: oldBalance, newlyReachedTiers: [] };
    }
    throw new Error(`Failed to record point event: ${eventError.message}`);
  }

  await supabase
    .from("customers")
    .update({ points_balance: newBalance, ...extraCustomerFields })
    .eq("id", customerId);

  const branding = toPassBusinessInput(business, tiers);

  if (customer.walletwallet_serial) {
    await updatePass(customer.walletwallet_serial, branding, {
      id: customerId,
      pointsBalance: newBalance,
      notification: customer.last_notification,
    });

    if (newlyReachedTiers.length > 0) {
      const message = `🎉 Reward unlocked: ${newlyReachedTiers[0].label}!`;
      await updatePass(customer.walletwallet_serial, branding, {
        id: customerId,
        pointsBalance: newBalance,
        notification: message,
      });
      await supabase.from("customers").update({ last_notification: message }).eq("id", customerId);
    }
  }

  return { status: "awarded", newBalance, newlyReachedTiers };
}
