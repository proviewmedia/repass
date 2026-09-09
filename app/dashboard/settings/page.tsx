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
      "name, program_name, color_preset, logo_url, wide_logo_url, icon_url, thumbnail_url, strip_url, sharing_prohibited, points_per_action",
    )
    .eq("id", currentBusiness.id)
    .single();

  return (
    <main className="dash-content">
      <div className="wrap flex justify-center">
        <div className="flex w-full max-w-[900px] flex-col gap-5 sm:gap-6">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight">Card Design</h1>
            <p className="auth-sub">Changes to your card&apos;s name, color, or logo push live to every customer&apos;s wallet.</p>
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
            }}
            error={searchParams.error}
            saved={searchParams.saved === "1"}
            previewUrl={searchParams.previewUrl}
          />
        </div>
      </div>
    </main>
  );
}
