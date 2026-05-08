create table if not exists customers (
  id bigserial primary key,
  name text not null,
  referral_code text not null unique,
  custom_referral_code text unique,
  device_id text unique,
  google_email text,
  google_subject text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table customers add column if not exists custom_referral_code text unique;
alter table customers add column if not exists device_id text unique;
alter table customers add column if not exists google_email text;
alter table customers add column if not exists google_subject text;

create table if not exists referrals (
  id bigserial primary key,
  customer_id bigint not null references customers(id) on delete cascade,
  referred_name text not null,
  referred_phone text,
  referred_device_id text,
  referred_ip text,
  referred_user_agent text,
  risk_score integer not null default 0,
  risk_reasons jsonb not null default '[]'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table referrals add column if not exists referred_device_id text;
alter table referrals add column if not exists referred_ip text;
alter table referrals add column if not exists referred_user_agent text;
alter table referrals add column if not exists risk_score integer not null default 0;
alter table referrals add column if not exists risk_reasons jsonb not null default '[]'::jsonb;

create table if not exists device_fingerprints (
  id bigserial primary key,
  device_id text not null unique,
  first_ip text,
  last_ip text,
  user_agent text,
  seen_count integer not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists reward_claims (
  id bigserial primary key,
  customer_id bigint not null references customers(id) on delete cascade,
  google_email text,
  google_subject text,
  selected_prize_name text,
  selected_prize_image text,
  status text not null default 'pending_google',
  valid_referrals_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table reward_claims add column if not exists selected_prize_name text;
alter table reward_claims add column if not exists selected_prize_image text;

create table if not exists rewards (
  id bigserial primary key,
  rank_number integer not null unique,
  name text not null,
  prize_name text not null,
  required_referrals integer not null,
  icon_class text not null default 'fa-solid fa-gift',
  is_locked boolean not null default false
);

create table if not exists missions (
  id bigserial primary key,
  title text not null,
  reward_points integer not null default 50,
  icon_class text not null,
  is_active boolean not null default true,
  is_completed boolean not null default true
);

insert into customers (id, name, referral_code, custom_referral_code, avatar_url)
values (1, 'Juan Perez', 'u1', 'juanperez', 'icono-sgi.jpg')
on conflict (id) do update set
  name = excluded.name,
  referral_code = case
    when customers.referral_code is null or customers.referral_code = '' or customers.referral_code = 'juanperez'
    then excluded.referral_code
    else customers.referral_code
  end,
  custom_referral_code = coalesce(customers.custom_referral_code, excluded.custom_referral_code),
  avatar_url = excluded.avatar_url;

select setval(pg_get_serial_sequence('customers', 'id'), coalesce((select max(id) from customers), 1), true);

insert into rewards (rank_number, name, prize_name, required_referrals, icon_class, is_locked)
values
  (1, 'Rango 1', 'Pasta dental', 3, 'fa-solid fa-tooth', false),
  (2, 'Rango 2', 'Jabon', 5, 'fa-solid fa-soap', false),
  (3, 'Rango 3', 'Detergente', 10, 'fa-solid fa-bottle-droplet', false),
  (4, 'Rango 4', 'Canasta hogar', 20, 'fa-solid fa-basket-shopping', true)
on conflict (rank_number) do update set
  name = excluded.name,
  prize_name = excluded.prize_name,
  required_referrals = excluded.required_referrals,
  icon_class = excluded.icon_class,
  is_locked = excluded.is_locked;

insert into missions (id, title, reward_points, icon_class, is_active, is_completed)
values
  (1, 'Seguir en Facebook', 50, 'fa-brands fa-facebook-f', true, true),
  (2, 'Seguir en TikTok', 50, 'fa-brands fa-tiktok', true, true),
  (3, 'Seguir en Instagram', 50, 'fa-brands fa-instagram', true, true),
  (4, 'Tus afiliados llegan a rangos', 100, 'fa-solid fa-users', true, true)
on conflict (id) do update set
  title = excluded.title,
  reward_points = excluded.reward_points,
  icon_class = excluded.icon_class,
  is_active = excluded.is_active,
  is_completed = excluded.is_completed;

insert into referrals (customer_id, referred_name, referred_phone, status)
select 1, 'Referido demo', '70000001', 'valid'
where not exists (select 1 from referrals where customer_id = 1);

update referrals set status = 'valid' where status = 'validado';
