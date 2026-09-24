alter table businesses
  add column points_display_style text not null default 'number'
  check (points_display_style in ('number', 'stamps'));
