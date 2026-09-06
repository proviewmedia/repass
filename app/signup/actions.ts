"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || password.length < 8) {
    redirect(`/signup?error=${encodeURIComponent("Enter a valid email and a password of at least 8 characters.")}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.session) {
    // Email confirmation is required by this Supabase project's auth settings.
    redirect("/signup?checkEmail=1");
  }

  redirect("/onboarding");
}
