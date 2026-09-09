"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { awardPoints } from "@/lib/points";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function addPoint(customerId: string) {
  const supabase = await createClient();

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, business_id")
    .eq("id", customerId)
    .single();

  if (customerError || !customer) {
    throw new Error("Customer not found");
  }

  await awardPoints({ supabase, customerId, businessId: customer.business_id, source: "manual" });

  revalidatePath("/dashboard");
}
