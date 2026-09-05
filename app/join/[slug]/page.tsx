import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { joinProgram } from "./actions";

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { error?: string };
}) {
  const supabase = createAdminClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("name, program_name, reward_threshold, reward_description, subscription_status")
    .eq("slug", params.slug)
    .single();

  if (!business) {
    notFound();
  }

  const closed = business!.subscription_status !== "active";

  return (
    <main className="auth-page">
      <div className="wrap auth-wrap">
        <div className="auth-card">
          <h1>{business!.program_name || business!.name}</h1>
          <p className="auth-sub">
            Earn a point every visit — {business!.reward_threshold} points gets you {business!.reward_description}.
          </p>

          {closed ? (
            <p className="auth-note">This program isn&apos;t accepting new members right now.</p>
          ) : (
            <form action={joinProgram.bind(null, params.slug)} className="auth-form">
              {searchParams.error && <p className="auth-error">{searchParams.error}</p>}
              <label>
                Your name
                <input type="text" name="name" required autoComplete="name" />
              </label>
              <label>
                Email (optional)
                <input type="email" name="email" autoComplete="email" />
              </label>
              <label>
                Phone (optional)
                <input type="tel" name="phone" autoComplete="tel" />
              </label>
              <button type="submit" className="btn">
                Get my card
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
