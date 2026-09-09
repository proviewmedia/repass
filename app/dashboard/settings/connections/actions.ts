"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
