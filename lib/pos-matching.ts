// Resolving "who paid" to "which enrolled customer" is the step every POS
// integration depends on, and all three (Square, Clover, Stripe) were doing it
// inline with an exact string compare on phone. That silently awarded nothing
// whenever the POS reported a number in a different format than the customer
// enrolled with, which is most of the time: "+14015551234" vs "4015551234"
// vs "(401) 555-1234" are all the same phone and none of them are equal.
//
// Centralized here so a fix lands in one place for every provider.

import type { createAdminClient } from "@/lib/supabase/admin";

export interface PosContact {
  email: string | null;
  phone: string | null;
}

export interface MatchedCustomer {
  id: string;
  points_balance: number;
}

export type MatchBasis = "email" | "phone";

export interface MatchResult {
  customer: MatchedCustomer | null;
  /** Which identifier found them, for logging. */
  basis: MatchBasis | null;
  /** More than one enrolled customer shares the identifier that matched. */
  ambiguous: boolean;
}

/** US-only scope, as elsewhere in the product: last 10 digits drops a +1 or 1. */
export function normalizePhone(value: string | null): string | null {
  const digits = (value || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits || null;
}

// ilike gives case-insensitive comparison, which plain eq does not, but it also
// treats % and _ as wildcards — and _ is legal in an email local part, where it
// would quietly match a different customer. Escaping them makes ilike an exact
// comparison that only ignores case.
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Finds the enrolled customer a POS payment belongs to.
 *
 * Email is tried first because it is the stronger identifier: two people can
 * legitimately share a phone number (a household, a couple, a business line)
 * but rarely an inbox. When only a phone matches and several customers share
 * it, the longest-enrolled one wins so the choice is deterministic rather than
 * dependent on row order, and `ambiguous` is set so the caller can log it.
 */
export async function findEnrolledCustomer(
  admin: ReturnType<typeof createAdminClient>,
  businessId: string,
  contact: PosContact,
): Promise<MatchResult> {
  const base = () =>
    admin
      .from("customers")
      .select("id, points_balance")
      .eq("business_id", businessId)
      .is("removed_at", null)
      .order("created_at", { ascending: true });

  const email = contact.email?.trim();
  if (email) {
    const { data } = await base().ilike("email", escapeLikePattern(email));
    if (data && data.length > 0) {
      return { customer: data[0], basis: "email", ambiguous: data.length > 1 };
    }
  }

  const phone = normalizePhone(contact.phone);
  if (phone) {
    const { data } = await base().eq("phone_normalized", phone);
    if (data && data.length > 0) {
      return { customer: data[0], basis: "phone", ambiguous: data.length > 1 };
    }
  }

  return { customer: null, basis: null, ambiguous: false };
}
