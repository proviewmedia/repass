import Link from "next/link";
import { Brand } from "@/components/brand";
import { signIn } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; redirectTo?: string };
}) {
  return (
    <main className="auth-page">
      <div className="wrap auth-wrap">
        <Card className="w-full max-w-[420px]">
          <CardHeader>
            <Brand href="/" />
            <CardTitle className="mt-3 text-2xl">Log in</CardTitle>
            <CardDescription>Welcome back.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={signIn} className="flex flex-col gap-4">
              {searchParams.error && <Alert variant="destructive">{searchParams.error}</Alert>}
              <input type="hidden" name="redirectTo" value={searchParams.redirectTo || "/dashboard"} />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" name="email" required autoComplete="email" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" name="password" required autoComplete="current-password" />
              </div>
              <Button type="submit">Log in</Button>
            </form>

            <p className="auth-alt">
              Don&apos;t have an account? <Link href="/signup">Start your program</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
