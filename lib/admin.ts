import { createClient } from "@/lib/supabase/server";

// Whether the signed-in user is a platform admin — checked against the
// RLS-scoped client so a logged-in user can answer this about themselves
// without needing elevated access just to ask. Admin access itself is never
// self-serve: rows in `admins` are inserted directly via SQL.
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  return !!data;
}
