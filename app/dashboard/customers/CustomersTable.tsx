"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { addPoint } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

interface Customer {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  points_balance: number;
}

function initials(customer: Customer): string {
  const first = customer.first_name?.[0] || "";
  const last = customer.last_name?.[0] || "";
  return (first + last).toUpperCase() || "?";
}

export default function CustomersTable({ customers }: { customers: Customer[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const name = `${c.first_name} ${c.last_name || ""}`.toLowerCase();
      return name.includes(q) || (c.email || "").toLowerCase().includes(q);
    });
  }, [customers, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-[var(--border-strong)] bg-card px-4 py-1 sm:max-w-xs">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers by name or email"
            className="h-9 border-none bg-transparent px-0 text-[14px] font-normal shadow-none focus-visible:ring-0"
          />
        </div>
        <Button asChild size="sm" className="rounded-full">
          <a href="/dashboard/customers/new">
            <Plus className="h-4 w-4" />
            Add customer
          </a>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle>Customers</CardTitle>
          <Badge>{customers.length}</Badge>
        </CardHeader>
        {filtered.length > 0 ? (
          <div className="overflow-x-auto border-t border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[12.5px] font-bold text-indigo-600">
                          {initials(customer)}
                        </div>
                        <div>
                          <div className="font-semibold">
                            {customer.first_name} {customer.last_name}
                          </div>
                          {customer.email && <div className="mt-0.5 text-[13px] text-muted-foreground">{customer.email}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-[18px] font-bold tabular-nums">{customer.points_balance}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild variant="ghost" size="sm">
                          <a href={`/dashboard/customers/${customer.id}`}>Edit</a>
                        </Button>
                        <form action={addPoint.bind(null, customer.id)}>
                          <Button type="submit" size="sm">
                            Add a point
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="dash-empty border-t border-border">
            {customers.length === 0
              ? "No customers yet — share your join link from the Dashboard to get your first one."
              : "No customers match your search."}
          </p>
        )}
      </Card>
    </div>
  );
}
