-- Square webhook subscriptions are owned by the application, not by individual
-- connected merchants — a merchant's OAuth token can't create or manage them
-- (confirmed via a 403 INSUFFICIENT_SCOPES from Square: subscription management
-- requires the app's own Personal Access Token). There is one subscription and
-- one signature key for the whole app (SQUARE_WEBHOOK_SIGNATURE_KEY env var),
-- not one per business.

alter table pos_connections drop column webhook_signature_key;
