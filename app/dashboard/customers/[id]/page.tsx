import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { updateCustomer, removeCustomer } from "./actions";

export default async function EditCustomerPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/dashboard/customers/${params.id}`);
  }

  const { data } = await supabase
    .from("customers")
    .select("id, name, email, phone, points_balance, businesses!inner(owner_user_id)")
    .eq("id", params.id)
    .is("removed_at", null)
    .single();

  const customer = data as unknown as {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    points_balance: number;
    businesses: { owner_user_id: string };
  } | null;

  if (!customer || customer.businesses.owner_user_id !== user!.id) {
    notFound();
  }

  return (
    <main className="auth-page">
      <div className="wrap auth-wrap">
        <div className="auth-card">
          <Link href="/dashboard" className="auth-sub" style={{ display: "inline-block", marginBottom: 8 }}>
            ← Back to dashboard
          </Link>
          <h1>Edit customer</h1>

          <form action={updateCustomer.bind(null, customer!.id)} className="auth-form">
            {searchParams.error && <p className="auth-error">{searchParams.error}</p>}

            <label>
              Name
              <input type="text" name="name" required defaultValue={customer!.name} />
            </label>
            <label>
              Email
              <input type="email" name="email" defaultValue={customer!.email || ""} />
            </label>
            <label>
              Phone
              <input type="tel" name="phone" defaultValue={customer!.phone || ""} />
            </label>
            <label>
              Points balance
              <input type="number" name="pointsBalance" min={0} required defaultValue={customer!.points_balance} />
            </label>

            <button type="submit" className="btn">
              Save
            </button>
          </form>

          <div className="danger-zone">
            <h2>Danger zone</h2>
            <p className="auth-sub">
              Removes their wallet pass and takes them off your active customer list. Their point history is kept.
            </p>
            <form action={removeCustomer.bind(null, customer!.id)} className="auth-form">
              <label>
                Type &ldquo;{customer!.name}&rdquo; to confirm
                <input type="text" name="confirmName" required autoComplete="off" />
              </label>
              <button type="submit" className="btn danger">
                Remove customer
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
