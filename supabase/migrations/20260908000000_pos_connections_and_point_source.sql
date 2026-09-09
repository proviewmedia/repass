-- POS integrations (Square now, Toast later): one connection row per
-- business per provider, plus idempotency tracking on point_events so a
-- retried webhook can't double-award points.

create table pos_connections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  provider text not null check (provider in ('square', 'toast')),
  external_merchant_id text not null,
  location_ids jsonb not null default '[]'::jsonb,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,
  webhook_signature_key text not null,
  connected_at timestamptz not null default now(),
  disconnected_at timestamptz,
  created_at timestamptz not null default now(),
  unique (business_id, provider)
);

alter table pos_connections enable row level security;

create policy "Owners manage their own pos_connections"
  on pos_connections for all
  using (business_id in (select id from businesses where owner_user_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_user_id = auth.uid()));

alter table point_events
  add column source text not null default 'manual',
  add column external_event_id text;

create unique index point_events_business_external_event_id_key
  on point_events (business_id, external_event_id)
  where external_event_id is not null;
