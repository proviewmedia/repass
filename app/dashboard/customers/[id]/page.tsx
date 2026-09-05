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
    .select("id, first_name, last_name, email, phone, points_balance, businesses!inner(owner_user_id)")
    .eq("id", params.id)
    .is("removed_at", null)
    .single();

  const customer = data as unknown as {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    points_balance: number;
    businesses: { owner_user_id: string };
  } | null;

  if (!customer || customer.businesses.owner_user_id !== user!.id) {
    notFound();
  }

  const fullName = `${customer!.first_name} ${customer!.last_name || ""}`.trim();

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

            <div className="form-row">
              <label>
                First name
                <input type="text" name="firstName" required defaultValue={customer!.first_name} />
              </label>
              <label>
                Last name
                <input type="text" name="lastName" required defaultValue={customer!.last_name || ""} />
              </label>
            </div>
            <label>
              Email
              <input type="email" name="email" required defaultValue={customer!.email || ""} />
            </label>
            <label>
              Phone
              <input type="tel" name="phone" required defaultValue={customer!.phone || ""} />
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
                Type &ldquo;{fullName}&rdquo; to confirm
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
