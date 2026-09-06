"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BUSINESS_BRANDING_COLUMNS, toPassBusinessInput, updatePass } from "@/lib/wallet";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function addPoint(customerId: string) {
  const supabase = await createClient();

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, business_id, points_balance, last_notification, walletwallet_serial")
    .eq("id", customerId)
    .single();

  if (customerError || !customer) {
    throw new Error("Customer not found");
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select(`points_per_action, ${BUSINESS_BRANDING_COLUMNS}`)
    .eq("id", customer.business_id)
    .single();

  if (businessError || !business) {
    throw new Error("Business not found");
  }

  const oldBalance = customer.points_balance;
  const newBalance = oldBalance + business.points_per_action;
  const crossedReward =
    Math.floor(oldBalance / business.reward_threshold) < Math.floor(newBalance / business.reward_threshold);

  await supabase.from("customers").update({ points_balance: newBalance }).eq("id", customerId);
  await supabase.from("point_events").insert({
    customer_id: customerId,
    business_id: customer.business_id,
    delta: business.points_per_action,
    resulting_balance: newBalance,
  });

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

  revalidatePath("/dashboard");
}
