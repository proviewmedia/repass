-- Multi-tier rewards: a business can now offer several rewards at different
-- point costs instead of one shared threshold. This creates the table and
-- backfills each existing business's current single reward as its first tier.
-- businesses.reward_threshold/reward_description are intentionally left in
-- place here (deprecated, unused after this ships) — dropped in a later,
-- separate migration once every read site is confirmed migrated.

create table reward_tiers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  points_cost int not null check (points_cost > 0),
  label text not null,
  square_discount_id text,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index reward_tiers_business_discount_key
  on reward_tiers (business_id, square_discount_id)
  where square_discount_id is not null and archived_at is null;

alter table reward_tiers enable row level security;

create policy "Owners manage their own reward_tiers"
  on reward_tiers for all
  using (business_id in (select id from businesses where owner_user_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_user_id = auth.uid()));

-- Backfill: every existing business's current single reward becomes tier #1.
-- square_discount_id stays null — deliberately not guess-matched against any
-- existing Square Catalog discount; the owner links it explicitly via the
-- new Rewards settings page.
insert into reward_tiers (business_id, points_cost, label)
select id, reward_threshold, reward_description
from businesses;
