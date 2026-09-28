import { getCurrentBusiness } from "@/lib/current-business";
import SettingsTabs from "./SettingsTabs";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin } = await getCurrentBusiness();

  return (
    <main className="dash-content">
      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="dash-head">
          <div>
            <h1>Settings</h1>
          </div>
        </div>

        <SettingsTabs isAdmin={isAdmin} />

        {children}
      </div>
    </main>
  );
}
