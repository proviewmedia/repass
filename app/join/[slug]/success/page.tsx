import Link from "next/link";

export default function JoinSuccessPage({
  searchParams,
}: {
  searchParams: { shareUrl?: string; name?: string };
}) {
  if (!searchParams.shareUrl) {
    return (
      <main className="auth-page">
        <div className="wrap auth-wrap">
          <div className="auth-card" style={{ textAlign: "center" }}>
            <h1>Something went wrong</h1>
            <p className="auth-sub">
              We couldn&apos;t find your card. <Link href="/">Go back home</Link>.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="wrap auth-wrap">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <h1>You&apos;re in{searchParams.name ? `, ${searchParams.name}` : ""}!</h1>
          <p className="auth-sub">Add your card to your phone&apos;s wallet to start earning points.</p>
          <a href={searchParams.shareUrl} className="btn" style={{ marginTop: 24, justifyContent: "center" }}>
            Add to Wallet
          </a>
        </div>
      </div>
    </main>
  );
}
