import Link from "next/link";
import { signUp } from "./actions";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string; checkEmail?: string };
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
          <h1>Start your program</h1>
          <p className="auth-sub">Create your account — $49/month, cancel anytime.</p>

          {searchParams.checkEmail ? (
            <p className="auth-note">Check your email for a confirmation link, then log in.</p>
          ) : (
            <form action={signUp} className="auth-form">
              {searchParams.error && <p className="auth-error">{searchParams.error}</p>}
              <label>
                Email
                <input type="email" name="email" required autoComplete="email" />
              </label>
              <label>
                Password
                <input type="password" name="password" required minLength={8} autoComplete="new-password" />
              </label>
              <button type="submit" className="btn">
                Create account
              </button>
            </form>
          )}

          <p className="auth-alt">
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
