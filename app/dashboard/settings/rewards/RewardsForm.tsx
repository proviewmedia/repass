"use client";

import { useState } from "react";
import { Archive, Link2, Pencil, Plus } from "lucide-react";
import { createRewardTier, updateRewardTier, archiveRewardTier, linkTierToDiscount } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Tier {
  id: string;
  label: string;
  points_cost: number;
  square_discount_id: string | null;
  archived_at: string | null;
}

interface SquareDiscount {
  id: string;
  name: string;
}

function discountName(discountId: string | null, discounts: SquareDiscount[]): string | null {
  if (!discountId) return null;
  return discounts.find((d) => d.id === discountId)?.name || "Linked discount";
}

function DiscountPicker({ squareDiscounts }: { squareDiscounts: SquareDiscount[] }) {
  const [mode, setMode] = useState<"existing" | "new">(squareDiscounts.length > 0 ? "existing" : "new");
  const [kind, setKind] = useState<"fixed_amount" | "fixed_percentage">("fixed_amount");

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
      <div className="flex gap-4 text-[13px]">
        {squareDiscounts.length > 0 && (
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="discountMode"
              value="existing"
              checked={mode === "existing"}
              onChange={() => setMode("existing")}
            />
            Use an existing discount
          </label>
        )}
        <label className="flex items-center gap-1.5">
          <input type="radio" name="discountMode" value="new" checked={mode === "new"} onChange={() => setMode("new")} />
          Create a new discount
        </label>
      </div>

      <div className="min-h-[168px]">
        {mode === "existing" ? (
          <select name="existingDiscountId" className="h-9 rounded-lg border border-input bg-transparent px-2 text-[15px]">
            {squareDiscounts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex flex-col gap-2">
            <Input name="newDiscountName" placeholder="Discount name" required={mode === "new"} />
            <div className="flex flex-col gap-1.5 text-[13px]">
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="newDiscountKind"
                  value="fixed_amount"
                  checked={kind === "fixed_amount"}
                  onChange={() => setKind("fixed_amount")}
                />
                Fixed amount off (e.g. free coffee — set to the item&apos;s price)
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="newDiscountKind"
                  value="fixed_percentage"
                  checked={kind === "fixed_percentage"}
                  onChange={() => setKind("fixed_percentage")}
                />
                Percentage off
              </label>
            </div>
            {kind === "fixed_amount" ? (
              <Input name="newDiscountAmount" type="number" step="0.01" min={0} placeholder="Amount ($)" />
            ) : (
              <Input name="newDiscountPercentage" type="number" min={1} max={100} placeholder="Percentage (e.g. 100 for free)" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EditRewardDialog({
  tier,
  linkedName,
  squareConnected,
  squareDiscounts,
}: {
  tier: Tier;
  linkedName: string | null;
  squareConnected: boolean;
  squareDiscounts: SquareDiscount[];
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit reward</DialogTitle>
          <DialogDescription>Update the name or points cost.</DialogDescription>
        </DialogHeader>
        <form action={updateRewardTier.bind(null, tier.id)} className="mt-4 flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`label-${tier.id}`}>Reward name</Label>
              <Input id={`label-${tier.id}`} name="label" defaultValue={tier.label} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`pointsCost-${tier.id}`}>Points cost</Label>
              <Input
                id={`pointsCost-${tier.id}`}
                name="pointsCost"
                type="number"
                min={1}
                defaultValue={tier.points_cost}
                required
              />
            </div>
          </div>
          <Button type="submit" className="self-start">
            Save changes
          </Button>
        </form>

        {squareConnected && (
          <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4">
            {linkedName ? (
              <Badge variant="success" className="w-fit">
                <Link2 className="h-3.5 w-3.5" /> Linked to: {linkedName}
              </Badge>
            ) : (
              <>
                <p className="text-[13px] font-semibold">Link to a Square discount</p>
                <form action={linkTierToDiscount.bind(null, tier.id)} className="flex flex-col gap-2">
                  <DiscountPicker squareDiscounts={squareDiscounts} />
                  <Button type="submit" size="sm" className="self-start">
                    Link discount
                  </Button>
                </form>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function RewardsForm({
  tiers,
  squareConnected,
  squareDiscounts,
}: {
  tiers: Tier[];
  squareConnected: boolean;
  squareDiscounts: SquareDiscount[];
}) {
  const active = tiers.filter((t) => !t.archived_at);
  const archived = tiers.filter((t) => t.archived_at);
  const [showArchived, setShowArchived] = useState(false);

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="flex items-center justify-end">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="rounded-full">
              <Plus className="h-4 w-4" />
              Add reward
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a reward</DialogTitle>
              <DialogDescription>Give it a name and a points cost.</DialogDescription>
            </DialogHeader>
            <form action={createRewardTier} className="mt-4 flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="label">Reward name</Label>
                  <Input id="label" name="label" placeholder="A free coffee" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pointsCost">Points cost</Label>
                  <Input id="pointsCost" name="pointsCost" type="number" min={1} defaultValue={10} required />
                </div>
              </div>

              {squareConnected ? (
                <DiscountPicker squareDiscounts={squareDiscounts} />
              ) : (
                <p className="text-[13px] text-muted-foreground">
                  Connect Square to link this reward to an auto-redeem discount — you can add it now and link it later.
                </p>
              )}

              <Button type="submit" className="self-start">
                Add reward
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle>Active rewards</CardTitle>
          <Badge>{active.length}</Badge>
        </CardHeader>
        {active.length === 0 && <p className="dash-empty border-t border-border">No rewards yet — add one above.</p>}
        {active.length > 0 && (
          <div className="overflow-x-auto border-t border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reward</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead>Square</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {active.map((tier) => {
                  const linkedName = discountName(tier.square_discount_id, squareDiscounts);
                  return (
                    <TableRow key={tier.id}>
                      <TableCell className="font-semibold">{tier.label}</TableCell>
                      <TableCell className="text-right text-[18px] font-bold tabular-nums">{tier.points_cost}</TableCell>
                      <TableCell>
                        {linkedName ? (
                          <Badge variant="success">
                            <Link2 className="h-3.5 w-3.5" /> {linkedName}
                          </Badge>
                        ) : (
                          <Badge variant="warning">Not linked</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <EditRewardDialog
                            tier={tier}
                            linkedName={linkedName}
                            squareConnected={squareConnected}
                            squareDiscounts={squareDiscounts}
                          />
                          <form action={archiveRewardTier.bind(null, tier.id)}>
                            <Button type="submit" variant="ghost" size="sm">
                              <Archive className="h-3.5 w-3.5" /> Archive
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        {archived.length > 0 && (
          <div className="border-t border-border">
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="w-full px-4 py-3 text-left text-[13px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {showArchived ? "Hide" : "Show"} archived rewards ({archived.length})
            </button>
            {showArchived && (
              <div className="border-t border-border opacity-70">
                {archived.map((tier) => (
                  <div
                    key={tier.id}
                    className="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0 text-[13px]"
                  >
                    <span>
                      {tier.label} — {tier.points_cost} pts
                    </span>
                    <span className="text-muted-foreground">Archived</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
