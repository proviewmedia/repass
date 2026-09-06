import { createBusiness } from "./actions";
import ColorPresetField from "./ColorPresetField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function OnboardingPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="auth-page">
      <div className="wrap auth-wrap">
        <Card className="w-full max-w-[480px]">
          <CardHeader>
            <CardTitle className="text-2xl">Set up your program</CardTitle>
            <CardDescription>This takes about a minute. You can change any of this later.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createBusiness} className="flex flex-col gap-4">
              {searchParams.error && <Alert variant="destructive">{searchParams.error}</Alert>}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Business name</Label>
                <Input id="name" type="text" name="name" required placeholder="Café Lumen" />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="slug">Sign-up page URL</Label>
                <div className="slug-input">
                  <span>repass.app/join/</span>
                  <input id="slug" type="text" name="slug" placeholder="cafe-lumen" pattern="[a-z0-9-]*" />
                </div>
              </div>

              <ColorPresetField />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pointsPerAction">Points per visit</Label>
                  <Input id="pointsPerAction" type="number" name="pointsPerAction" defaultValue={1} min={1} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="rewardThreshold">Points for a reward</Label>
                  <Input id="rewardThreshold" type="number" name="rewardThreshold" defaultValue={10} min={1} required />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rewardDescription">What the reward is</Label>
                <Input id="rewardDescription" type="text" name="rewardDescription" defaultValue="A free item" required />
              </div>

              <Button type="submit">Continue to billing</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
