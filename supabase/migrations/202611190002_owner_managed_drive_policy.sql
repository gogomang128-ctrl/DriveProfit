create table public.drive_policy (
 id smallint primary key default 1 check(id=1),
 price_80 numeric(7,2) not null check(price_80>0),
 price_92 numeric(7,2) not null check(price_92>0),
 price_95 numeric(7,2) not null check(price_95>0),
 effective_on date not null,
 wear numeric not null check(wear between 0 and 100),
 speed numeric not null check(speed between 5 and 200),
 tank numeric not null check(tank between 0.1 and 150),
 sound boolean not null,
 vehicle_overrides jsonb not null default '{}' check(jsonb_typeof(vehicle_overrides)='object')
);
alter table public.drive_policy enable row level security;
revoke all on public.drive_policy from public,anon,authenticated;
grant select on public.drive_policy to anon,authenticated;
create policy read_published_drive_policy on public.drive_policy for select to anon,authenticated using(true);
insert into public.drive_policy(id,price_80,price_92,price_95,effective_on,wear,speed,tank,sound)
values(1,20.75,22.25,24,'2026-11-19',5,80,8,false);
