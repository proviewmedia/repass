"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BUSINESS_BRANDING_COLUMNS,
  createPass,
  revokePass,
  toPassBusinessInput,
  updatePass,
  type BusinessBrandingRow,
} from "@/lib/wallet";
import { sendWalletLinkEmail } from "@/lib/resend";

// `includeRemoved` exists for restoreCustomer, which by definition acts on a
// row every other action deliberately filters out.
async function requireOwnedCustomer(customerId: string, options: { includeRemoved?: boolean } = {}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/dashboard/customers/${customerId}`);
  }

  let query = supabase
    .from("customers")
    .select(
      `id, first_name, last_name, email, business_id, points_balance, last_notification, walletwallet_serial, share_url, removed_at, businesses!inner(owner_user_id, ${BUSINESS_BRANDING_COLUMNS})`,
    )
    .eq("id", customerId);

  if (!options.includeRemoved) {
    query = query.is("removed_at", null);
  }

  const { data } = await query.single();

  const customer = data as unknown as {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string | null;
    business_id: string;
    points_balance: number;
    last_notification: string;
    walletwallet_serial: string | null;
    share_url: string | null;
    removed_at: string | null;
    businesses: BusinessBrandingRow & { owner_user_id: string };
  } | null;

  if (!customer || customer.businesses.owner_user_id !== user!.id) {
    redirect("/dashboard/customers?error=" + encodeURIComponent("Customer not found."));
  }

  return { supabase, customer: customer! };
}

// Re-sends the wallet link a customer already has. Nothing is reissued: the
// pass and its share URL were created at enrollment and stay valid, so this
// only puts an existing link back in front of someone who lost it.
export async function resendWalletLink(customerId: string) {
  const { customer } = await requireOwnedCustomer(customerId);
  const back = `/dashboard/customers/${customerId}`;

  if (!customer.email) {
    redirect(`${back}?error=${encodeURIComponent("This customer has no email address on file.")}`);
  }

  if (!customer.share_url) {
    redirect(
      `${back}?error=${encodeURIComponent("This customer has no wallet pass yet, so there's no link to send.")}`,
    );
  }

  try {
    await sendWalletLinkEmail(customer.email!, customer.businesses.name, customer.share_url!);
  } catch (err) {
    console.error(`Failed to resend wallet link for customer ${customerId}`, err);
    redirect(`${back}?error=${encodeURIComponent("Could not send the email. Try again in a moment.")}`);
  }

  redirect(`${back}?sent=1`);
}

// Brings back a customer who was removed. A new pass has to be issued because
// removeCustomer revokes the old one at WalletWallet with a hard DELETE, which
// leaves the stored share_url pointing at nothing. The points balance is
// carried over untouched: the row was never deleted, only marked.
export async function restoreCustomer(customerId: string) {
  const { supabase, customer } = await requireOwnedCustomer(customerId, { includeRemoved: true });
  const back = `/dashboard/customers/${customerId}`;

  if (!customer.removed_at) {
    redirect(back);
  }

  let pass;
  try {
    pass = await createPass(toPassBusinessInput(customer.businesses), {
      id: customer.id,
      pointsBalance: customer.points_balance,
      notification: " ",
    });
  } catch (err) {
    console.error(`Failed to issue a replacement pass for customer ${customerId}`, err);
    redirect(
      `${back}?error=${encodeURIComponent("Could not issue a new wallet pass. Their card was not restored.")}`,
    );
  }

  await supabase
    .from("customers")
    .update({
      removed_at: null,
      walletwallet_serial: pass!.serialNumber,
      share_url: pass!.shareUrl,
      google_save_url: pass!.googleSaveUrl,
      last_notification: " ",
    })
    .eq("id", customerId);

  redirect(`${back}?restored=1`);
}

export async function updateCustomer(customerId: string, formData: FormData) {
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const pointsBalance = Math.max(0, parseInt(String(formData.get("pointsBalance") || "0"), 10) || 0);

  if (!firstName || !lastName) {
    redirect(`/dashboard/customers/${customerId}?error=${encodeURIComponent("First and last name are required.")}`);
  }
  if (!email || !email.includes("@")) {
    redirect(`/dashboard/customers/${customerId}?error=${encodeURIComponent("A valid email is required.")}`);
  }
  if (!phone) {
    redirect(`/dashboard/customers/${customerId}?error=${encodeURIComponent("Phone number is required.")}`);
  }

  const { supabase, customer } = await requireOwnedCustomer(customerId);
  const business = customer.businesses;
  const balanceChanged = pointsBalance !== customer.points_balance;

  const { error } = await supabase
    .from("customers")
    .update({ first_name: firstName, last_name: lastName, email, phone, points_balance: pointsBalance })
    .eq("id", customerId);

  if (error) {
    redirect(`/dashboard/customers/${customerId}?error=${encodeURIComponent(error.message)}`);
  }

  if (balanceChanged) {
    await supabase.from("point_events").insert({
      customer_id: customerId,
      business_id: customer.business_id,
      delta: pointsBalance - customer.points_balance,
      resulting_balance: pointsBalance,
    });

    if (customer.walletwallet_serial) {
      await updatePass(
        customer.walletwallet_serial,
        toPassBusinessInput(business),
        { id: customerId, pointsBalance, notification: customer.last_notification },
      ).catch((err) => console.error(`Failed to push manual balance edit for customer ${customerId}`, err));
    }
  }

  redirect("/dashboard/customers?updated=1");
}

export async function removeCustomer(customerId: string, formData: FormData) {
  const confirmName = String(formData.get("confirmName") || "").trim();
  const { supabase, customer } = await requireOwnedCustomer(customerId);
  const fullName = `${customer.first_name} ${customer.last_name || ""}`.trim();

  if (confirmName !== fullName) {
    redirect(
      `/dashboard/customers/${customerId}?error=${encodeURIComponent("Type the customer's name exactly to confirm removal.")}`,
    );
  }

  if (customer.walletwallet_serial) {
    await revokePass(customer.walletwallet_serial).catch((err) =>
      console.error(`Failed to revoke pass for customer ${customerId}`, err),
    );
  }

  await supabase.from("customers").update({ removed_at: new Date().toISOString() }).eq("id", customerId);

  redirect("/dashboard/customers?removed=1");
}
