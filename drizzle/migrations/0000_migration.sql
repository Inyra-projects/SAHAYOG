create extension if not exists pgcrypto with schema extensions;

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  pin_hash text not null,
  role text not null check (role in ('admin','manager','phlebo','frontdesk')),
  center text not null default 'Nanded City',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.kras (
  id text primary key default gen_random_uuid()::text,
  role text not null check (role in ('phlebo','frontdesk')),
  name text not null,
  target numeric not null,
  unit text not null default '',
  weight numeric not null,
  direction text not null check (direction in ('higher_better','lower_better')),
  sort int not null default 0
);
create table public.weekly_entries (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  week_start date not null,
  actuals jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  unique (staff_id, week_start)
);
create table public.peer_ratings (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.staff(id) on delete cascade,
  to_id uuid not null references public.staff(id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  tag text,
  comment text,
  created_at timestamptz not null default now()
);
create table public.sessions (
  token_hash text primary key,
  staff_id uuid not null references public.staff(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.login_events (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  at timestamptz not null default now()
);

grant all on public.staff, public.kras, public.weekly_entries, public.peer_ratings, public.sessions, public.login_events to service_role;
alter table public.staff enable row level security;
alter table public.kras enable row level security;
alter table public.weekly_entries enable row level security;
alter table public.peer_ratings enable row level security;
alter table public.sessions enable row level security;
alter table public.login_events enable row level security;

insert into public.staff (name, phone, pin_hash, role) values
('Dr. Sheetal','9876500001',encode(extensions.digest('9876500001:0000','sha256'),'hex'),'admin'),
('Sandeep Gaikwad','9876500100',encode(extensions.digest('9876500100:0100','sha256'),'hex'),'manager'),
('Priya Jadhav','9876501001',encode(extensions.digest('9876501001:1001','sha256'),'hex'),'phlebo'),
('Rohit Shinde','9876501002',encode(extensions.digest('9876501002:1002','sha256'),'hex'),'phlebo'),
('Sneha Pawar','9876501003',encode(extensions.digest('9876501003:1003','sha256'),'hex'),'phlebo'),
('Amit Kulkarni','9876501004',encode(extensions.digest('9876501004:1004','sha256'),'hex'),'phlebo'),
('Meera Deshmukh','9876502001',encode(extensions.digest('9876502001:2001','sha256'),'hex'),'frontdesk'),
('Nikhil Patil','9876502002',encode(extensions.digest('9876502002:2002','sha256'),'hex'),'frontdesk'),
('Anjali More','9876502003',encode(extensions.digest('9876502003:2003','sha256'),'hex'),'frontdesk');

insert into public.kras (id, role, name, target, unit, weight, direction, sort) values
('k1','phlebo','Home visits completed',40,'visits',25,'higher_better',1),
('k2','phlebo','Same-day callbacks closed',95,'%',20,'higher_better',2),
('k3','phlebo','On-time collections',90,'%',15,'higher_better',3),
('k4','phlebo','Samples diverted / ignored',0,'samples',25,'lower_better',4),
('k5','phlebo','Failed / abandoned visits',2,'visits',15,'lower_better',5),
('k6','frontdesk','Digital leads logged with source',100,'%',25,'higher_better',6),
('k7','frontdesk','Lead callbacks within SLA',90,'%',25,'higher_better',7),
('k8','frontdesk','Bookings from digital leads',25,'bookings',25,'higher_better',8),
('k9','frontdesk','Junk leads correctly flagged',90,'%',25,'higher_better',9);

-- weeks: 2026-09-14 (Sep), 2026-09-21 (Sep), 2026-09-28 (Oct, ISO week 40)
insert into public.weekly_entries (staff_id, week_start, actuals)
select s.id, w.ws::date, v.a::jsonb from public.staff s
join (values
 ('9876501001','{"k1":42,"k2":98,"k3":92,"k4":0,"k5":1}','{"k1":40,"k2":96,"k3":91,"k4":0,"k5":1}'),
 ('9876501002','{"k1":35,"k2":80,"k3":85,"k4":2,"k5":3}','{"k1":37,"k2":84,"k3":86,"k4":1,"k5":3}'),
 ('9876501003','{"k1":40,"k2":95,"k3":90,"k4":0,"k5":2}','{"k1":39,"k2":94,"k3":90,"k4":0,"k5":2}'),
 ('9876501004','{"k1":28,"k2":70,"k3":75,"k4":4,"k5":5}','{"k1":30,"k2":72,"k3":78,"k4":3,"k5":4}'),
 ('9876502001','{"k6":100,"k7":95,"k8":28,"k9":92}','{"k6":98,"k7":93,"k8":26,"k9":90}'),
 ('9876502002','{"k6":70,"k7":75,"k8":15,"k9":60}','{"k6":72,"k7":78,"k8":16,"k9":62}'),
 ('9876502003','{"k6":90,"k7":88,"k8":22,"k9":85}','{"k6":88,"k7":86,"k8":21,"k9":84}')
) as d(phone, exact, prior) on d.phone = s.phone
cross join lateral (values ('2026-09-14', d.prior), ('2026-09-21', d.exact), ('2026-09-28', d.exact)) as v(ws, a)
cross join lateral (select v.ws) w(ws);

insert into public.peer_ratings (from_id, to_id, stars, tag)
select f.id, t.id, x.stars, x.tag from (values
 ('9876502001','9876501001',5,'patient handling'),
 ('9876501003','9876501002',3,'handoffs'),
 ('9876502003','9876502001',4,'lead tagging')) x(fp,tp,stars,tag)
join public.staff f on f.phone=x.fp join public.staff t on t.phone=x.tp;