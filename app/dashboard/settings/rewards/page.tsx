import { getCurrentBusiness } from "@/lib/current-business";
import { listDiscounts, type PosConnectionRow } from "@/lib/square";
import { Alert } from "@/components/ui/alert";
import RewardsForm from "./RewardsForm";

export default async function RewardsPage({
  searchParams,
}: {
  searchParams: { saved?: string; error?: string };
}) {
  const { supabase, business } = await getCurrentBusiness();

  const { data: tiers } = await supabase
    .from("reward_tiers")
    .select("id, label, points_cost, square_discount_id, archived_at")
    .eq("business_id", business!.id)
    .order("points_cost", { ascending: true });

  const { data: connection } = await supabase
    .from("pos_connections")
    .select("id, business_id, external_merchant_id, access_token, refresh_token, token_expires_at")
    .eq("business_id", business!.id)
    .eq("provider", "square")
    .is("disconnected_at", null)
    .maybeSingle<PosConnectionRow>();

  let squareDiscounts: { id: string; name: string }[] = [];
  let squareError: string | null = null;
  if (connection) {
    try {
      squareDiscounts = await listDiscounts(connection);
    } catch {
      squareError = "Reconnect Square to manage reward discounts.";
    }
  }

  return (
    <main className="dash-content">
      <div className="wrap flex flex-col gap-5 sm:gap-6">
        <div className="dash-head">
          <div>
            <h1>Rewards</h1>
            <p className="auth-sub">
              What customers can redeem, and what it costs. Link a reward to a Square discount and staff can apply
              it at checkout — the points come off automatically.
            </p>
          </div>
        </div>

        {searchParams.error && <Alert variant="destructive">{searchParams.error}</Alert>}
        {searchParams.saved === "1" && <Alert>Saved.</Alert>}
        {squareError && <Alert variant="destructive">{squareError}</Alert>}
        {!connection && (
          <Alert>
            Connect Square to link rewards to a discount and redeem them automatically —{" "}
            <a href="/dashboard/settings/connections" className="underline">
              Connections
            </a>
            .
          </Alert>
        )}

        <RewardsForm
          tiers={tiers || []}
          squareConnected={!!connection && !squareError}
          squareDiscounts={squareDiscounts}
        />
      </div>
    </main>
  );
}
