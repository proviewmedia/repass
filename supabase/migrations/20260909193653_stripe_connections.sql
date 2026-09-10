-- Stripe Connect connections, so a business can import its own Stripe
-- customers into their loyalty program. Separate from pos_connections
-- (Square/Toast) because Stripe Connect's OAuth tokens don't expire and
-- don't need a refresh_token/token_expires_at cycle the same way.

create table stripe_connections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  stripe_account_id text not null,
  access_token text not null,
  refresh_token text,
  scope text not null,
  connected_at timestamptz not null default now(),
  disconnected_at timestamptz,
  created_at timestamptz not null default now(),
  unique (business_id)
);

alter table stripe_connections enable row level security;

create policy "Owners manage their own stripe_connections"
  on stripe_connections for all
  using (business_id in (select id from businesses where owner_user_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_user_id = auth.uid()));
