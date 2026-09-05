import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { updateCustomer } from "./actions";

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

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, email, phone, points_balance")
    .eq("id", params.id)
    .single();

  if (!customer) {
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
        </div>
      </div>
    </main>
  );
}
