import { getCurrentBusiness } from "@/lib/current-business";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string; previewUrl?: string };
}) {
  const { supabase, business: currentBusiness } = await getCurrentBusiness();

  const { data: business } = await supabase
    .from("businesses")
    .select(
      "name, program_name, color_preset, logo_url, wide_logo_url, icon_url, thumbnail_url, strip_url, sharing_prohibited, points_per_action, points_display_style",
    )
    .eq("id", currentBusiness.id)
    .single();

  const { data: tiers } = await supabase
    .from("reward_tiers")
    .select("points_cost, label")
    .eq("business_id", currentBusiness.id)
    .is("archived_at", null)
    .order("points_cost", { ascending: true });

  const rewardTiers = (tiers || []).map((t) => ({ pointsCost: t.points_cost, label: t.label }));

  return (
    <main className="dash-content">
      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="dash-head">
          <div>
            <h1>Card Design</h1>
            <p className="auth-sub">Changes to your card&apos;s name, color, or logo push live to every customer&apos;s wallet.</p>
          </div>
        </div>

        <SettingsForm
          initial={{
            name: business!.name,
            programName: business!.program_name || business!.name,
            colorPreset: business!.color_preset,
            logoUrl: business!.logo_url,
            wideLogoUrl: business!.wide_logo_url,
            iconUrl: business!.icon_url,
            thumbnailUrl: business!.thumbnail_url,
            stripUrl: business!.strip_url,
            allowSharing: !business!.sharing_prohibited,
            pointsPerAction: business!.points_per_action,
            pointsDisplayStyle: business!.points_display_style === "stamps" ? "stamps" : "number",
          }}
          rewardTiers={rewardTiers}
          error={searchParams.error}
          saved={searchParams.saved === "1"}
          previewUrl={searchParams.previewUrl}
        />
      </div>
    </main>
  );
}
