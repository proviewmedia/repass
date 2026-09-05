import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard/settings");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select(
      "name, program_name, color_preset, logo_url, points_per_action, reward_threshold, reward_description",
    )
    .eq("owner_user_id", user!.id)
    .single();

  if (!business) {
    redirect("/onboarding");
  }

  return (
    <main className="auth-page">
      <div className="wrap auth-wrap">
        <div className="auth-card auth-card--wide settings-card">
          <Link href="/dashboard" className="auth-sub" style={{ display: "inline-block", marginBottom: 8 }}>
            ← Back to dashboard
          </Link>
          <h1>Program settings</h1>
          <p className="auth-sub">Changes to your card&apos;s name, color, or logo push live to every customer&apos;s wallet.</p>

          <SettingsForm
            initial={{
              name: business!.name,
              programName: business!.program_name || business!.name,
              colorPreset: business!.color_preset,
              logoUrl: business!.logo_url,
              pointsPerAction: business!.points_per_action,
              rewardThreshold: business!.reward_threshold,
              rewardDescription: business!.reward_description,
            }}
            error={searchParams.error}
            saved={searchParams.saved === "1"}
          />
        </div>
      </div>
    </main>
  );
}
