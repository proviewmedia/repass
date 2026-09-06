import Link from "next/link";
import { signUp } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string; checkEmail?: string };
}) {
  return (
    <main className="auth-page">
      <div className="wrap auth-wrap">
        <Card className="w-full max-w-[420px]">
          <CardHeader>
            <Link href="/" className="brand">
              <span className="mark">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2.5" />
                  <path d="M2 10h20" />
                </svg>
              </span>
              Repass
            </Link>
            <CardTitle className="mt-3 text-2xl">Start your program</CardTitle>
            <CardDescription>Create your account — $49/month, cancel anytime.</CardDescription>
          </CardHeader>
          <CardContent>
            {searchParams.checkEmail ? (
              <Alert>Check your email for a confirmation link, then log in.</Alert>
            ) : (
              <form action={signUp} className="flex flex-col gap-4">
                {searchParams.error && <Alert variant="destructive">{searchParams.error}</Alert>}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" name="email" required autoComplete="email" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" name="password" required minLength={8} autoComplete="new-password" />
                </div>
                <Button type="submit">Create account</Button>
              </form>
            )}

            <p className="auth-alt">
              Already have an account? <Link href="/login">Log in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
