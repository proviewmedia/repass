"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BUSINESS_BRANDING_COLUMNS, revokePass, toPassBusinessInput, updatePass, type BusinessBrandingRow } from "@/lib/wallet";

async function requireOwnedCustomer(customerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/dashboard/customers/${customerId}`);
  }

  const { data } = await supabase
    .from("customers")
    .select(
      `id, first_name, last_name, business_id, points_balance, last_notification, walletwallet_serial, businesses!inner(owner_user_id, ${BUSINESS_BRANDING_COLUMNS})`,
    )
    .eq("id", customerId)
    .is("removed_at", null)
    .single();

  const customer = data as unknown as {
    id: string;
    first_name: string;
    last_name: string | null;
    business_id: string;
    points_balance: number;
    last_notification: string;
    walletwallet_serial: string | null;
    businesses: BusinessBrandingRow & { owner_user_id: string };
  } | null;

  if (!customer || customer.businesses.owner_user_id !== user!.id) {
    redirect("/dashboard?error=" + encodeURIComponent("Customer not found."));
  }

  return { supabase, customer: customer! };
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

  redirect("/dashboard?updated=1");
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

  redirect("/dashboard?removed=1");
}
