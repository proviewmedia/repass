alter table pos_connections
  drop constraint pos_connections_provider_check,
  add constraint pos_connections_provider_check check (provider in ('square', 'toast', 'clover'));
