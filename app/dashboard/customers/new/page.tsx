import { addCustomer } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function AddCustomerPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="dash-content">
      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="dash-head">
          <div>
            <h1>Add customer</h1>
            <p className="auth-sub">They&apos;ll get a real wallet card and an email with the link right away.</p>
          </div>
        </div>

        <div className="flex w-full max-w-[520px] flex-col gap-4 sm:gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Customer info</CardTitle>
              <CardDescription>Same info they&apos;d enter scanning your join QR code themselves.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={addCustomer} className="flex flex-col gap-4">
                {searchParams.error && <Alert variant="destructive">{searchParams.error}</Alert>}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" type="text" name="firstName" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" type="text" name="lastName" required />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" name="email" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" name="phone" required />
                </div>

                <div className="flex items-center gap-3">
                  <Button type="submit">Add customer</Button>
                  <Button asChild variant="ghost">
                    <a href="/dashboard/customers">Cancel</a>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
