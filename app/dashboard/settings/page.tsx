import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { updateSettings } from "./actions";

const COLOR_PRESETS = [
  { value: "dark", label: "Dark" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "red", label: "Red" },
  { value: "purple", label: "Purple" },
  { value: "orange", label: "Orange" },
];

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
        <div className="auth-card auth-card--wide">
          <Link href="/dashboard" className="auth-sub" style={{ display: "inline-block", marginBottom: 8 }}>
            ← Back to dashboard
          </Link>
          <h1>Program settings</h1>
          <p className="auth-sub">Changes to your card&apos;s name, color, or logo push live to every customer&apos;s wallet.</p>

          <form action={updateSettings} className="auth-form">
            {searchParams.error && <p className="auth-error">{searchParams.error}</p>}
            {searchParams.saved === "1" && (
              <p className="auth-note">Saved — updated cards are pushing out to customers now.</p>
            )}

            <label>
              Business name
              <input type="text" name="name" required defaultValue={business!.name} />
            </label>

            <label>
              Program name (shown on the card)
              <input type="text" name="programName" defaultValue={business!.program_name || business!.name} />
            </label>

            <label>
              Card color
              <select name="colorPreset" defaultValue={business!.color_preset}>
                {COLOR_PRESETS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Logo image URL (optional)
              <input type="url" name="logoUrl" placeholder="https://…" defaultValue={business!.logo_url || ""} />
            </label>

            <div className="form-row">
              <label>
                Points per visit
                <input type="number" name="pointsPerAction" defaultValue={business!.points_per_action} min={1} required />
              </label>
              <label>
                Points for a reward
                <input type="number" name="rewardThreshold" defaultValue={business!.reward_threshold} min={1} required />
              </label>
            </div>

            <label>
              What the reward is
              <input type="text" name="rewardDescription" defaultValue={business!.reward_description} required />
            </label>

            <button type="submit" className="btn">
              Save changes
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
