import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";

// Shared by every /dashboard/** page (and the layout that wraps them) so the
// auth + business + admin lookup happens once per request — React's cache()
// dedupes identical calls within a single render pass.
export const getCurrentBusiness = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, subscription_status, points_per_action")
    .eq("owner_user_id", user!.id)
    .single();

  const isAdmin = await isCurrentUserAdmin();

  if (!business) {
    redirect(isAdmin ? "/admin" : "/onboarding");
  }

  return { supabase, user: user!, business: business!, isAdmin };
});
