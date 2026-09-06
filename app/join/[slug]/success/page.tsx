import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function JoinSuccessPage({
  searchParams,
}: {
  searchParams: { shareUrl?: string; name?: string };
}) {
  if (!searchParams.shareUrl) {
    return (
      <main className="auth-page">
        <div className="wrap auth-wrap">
          <Card className="w-full max-w-[420px] text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
              <CardDescription>
                We couldn&apos;t find your card. <Link href="/">Go back home</Link>.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="wrap auth-wrap">
        <Card className="w-full max-w-[420px] text-center">
          <CardHeader>
            <CardTitle className="text-2xl">You&apos;re in{searchParams.name ? `, ${searchParams.name}` : ""}!</CardTitle>
            <CardDescription>Add your card to your phone&apos;s wallet to start earning points.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full justify-center">
              <a href={searchParams.shareUrl}>Add to Wallet</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
