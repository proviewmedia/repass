import Link from "next/link";
import { signIn } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; redirectTo?: string };
}) {
  return (
    <main className="auth-page">
      <div className="wrap auth-wrap">
        <div className="auth-card">
          <Link href="/" className="brand">
            <span className="mark">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2.5" />
                <path d="M2 10h20" />
              </svg>
            </span>
            Repass
          </Link>
          <h1>Log in</h1>
          <p className="auth-sub">Welcome back.</p>

          <form action={signIn} className="auth-form">
            {searchParams.error && <p className="auth-error">{searchParams.error}</p>}
            <input type="hidden" name="redirectTo" value={searchParams.redirectTo || "/dashboard"} />
            <label>
              Email
              <input type="email" name="email" required autoComplete="email" />
            </label>
            <label>
              Password
              <input type="password" name="password" required autoComplete="current-password" />
            </label>
            <button type="submit" className="btn">
              Log in
            </button>
          </form>

          <p className="auth-alt">
            Don&apos;t have an account? <Link href="/signup">Start your program</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
