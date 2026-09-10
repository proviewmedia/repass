-- Stripe Connect customer import was built on a miscommunication — the
-- actual need was importing customers from Square, which is already
-- connected via OAuth for point-earning and needs no separate integration.
-- Removing the Stripe Connect table rather than maintaining two import
-- paths for a need only one of them serves.

drop table if exists stripe_connections;
