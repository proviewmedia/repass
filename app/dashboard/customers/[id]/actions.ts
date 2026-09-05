"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePass } from "@/lib/wallet";

export async function updateCustomer(customerId: string, formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const pointsBalance = Math.max(0, parseInt(String(formData.get("pointsBalance") || "0"), 10) || 0);

  if (!name) {
    redirect(`/dashboard/customers/${customerId}?error=${encodeURIComponent("Name is required.")}`);
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("business_id, points_balance, last_notification, walletwallet_serial")
    .eq("id", customerId)
    .single();

  if (customerError || !customer) {
    redirect("/dashboard?error=" + encodeURIComponent("Customer not found."));
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("name, program_name, color_preset, logo_url, reward_threshold, reward_description")
    .eq("id", customer!.business_id)
    .single();

  if (!business) {
    redirect("/dashboard?error=" + encodeURIComponent("Business not found."));
  }

  const balanceChanged = pointsBalance !== customer!.points_balance;

  const { error } = await supabase
    .from("customers")
    .update({ name, email: email || null, phone: phone || null, points_balance: pointsBalance })
    .eq("id", customerId);

  if (error) {
    redirect(`/dashboard/customers/${customerId}?error=${encodeURIComponent(error.message)}`);
  }

  if (balanceChanged) {
    await supabase.from("point_events").insert({
      customer_id: customerId,
      business_id: customer!.business_id,
      delta: pointsBalance - customer!.points_balance,
      resulting_balance: pointsBalance,
    });

    if (customer!.walletwallet_serial) {
      await updatePass(
        customer!.walletwallet_serial,
        {
          name: business!.name,
          programName: business!.program_name,
          colorPreset: business!.color_preset,
          logoUrl: business!.logo_url,
        },
        { id: customerId, pointsBalance, notification: customer!.last_notification },
      ).catch((err) => console.error(`Failed to push manual balance edit for customer ${customerId}`, err));
    }
  }

  redirect("/dashboard?updated=1");
}
