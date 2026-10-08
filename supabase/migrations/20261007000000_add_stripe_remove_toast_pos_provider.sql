-- Toast declined the integration (Oct 2026), so it comes out of the allowed
-- providers; Stripe Connect goes in.
alter table pos_connections
  drop constraint pos_connections_provider_check,
  add constraint pos_connections_provider_check check (provider in ('square', 'clover', 'stripe'));

-- Stripe Connect returns only an account id (stripe_user_id); access_token and
-- refresh_token are deprecated in favour of the platform key + Stripe-Account
-- header, so a Stripe connection genuinely has no tokens to store.
alter table pos_connections
  alter column access_token drop not null,
  alter column refresh_token drop not null,
  alter column token_expires_at drop not null;
