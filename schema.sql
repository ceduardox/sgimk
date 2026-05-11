create table if not exists customers (
  id bigserial primary key,
  name text not null,
  referral_code text not null unique,
  custom_referral_code text unique,
  device_id text unique,
  google_email text,
  google_subject text,
  email text,
  whatsapp_country_code text,
  whatsapp_number text,
  password_hash text,
  registered_at timestamptz,
  selected_prize_id text,
  selected_prize_name text,
  selected_prize_image text,
  prize_attempts integer not null default 0,
  extra_prize_attempts integer not null default 0,
  prize_locked_at timestamptz,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table customers add column if not exists custom_referral_code text unique;
alter table customers add column if not exists device_id text unique;
alter table customers add column if not exists google_email text;
alter table customers add column if not exists google_subject text;
alter table customers add column if not exists email text;
alter table customers add column if not exists whatsapp_country_code text;
alter table customers add column if not exists whatsapp_number text;
alter table customers add column if not exists password_hash text;
alter table customers add column if not exists registered_at timestamptz;
alter table customers add column if not exists selected_prize_id text;
alter table customers add column if not exists selected_prize_name text;
alter table customers add column if not exists selected_prize_image text;
alter table customers add column if not exists prize_attempts integer not null default 0;
alter table customers add column if not exists extra_prize_attempts integer not null default 0;
alter table customers add column if not exists prize_locked_at timestamptz;

create table if not exists referrals (
  id bigserial primary key,
  customer_id bigint not null references customers(id) on delete cascade,
  referred_name text not null,
  referred_phone text,
  referred_customer_id bigint references customers(id) on delete set null,
  referred_device_id text,
  referred_ip text,
  referred_user_agent text,
  risk_score integer not null default 0,
  risk_reasons jsonb not null default '[]'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table referrals add column if not exists referred_device_id text;
alter table referrals add column if not exists referred_customer_id bigint references customers(id) on delete set null;
alter table referrals add column if not exists referred_ip text;
alter table referrals add column if not exists referred_user_agent text;
alter table referrals add column if not exists risk_score integer not null default 0;
alter table referrals add column if not exists risk_reasons jsonb not null default '[]'::jsonb;

create table if not exists device_fingerprints (
  id bigserial primary key,
  device_id text not null unique,
  customer_id bigint references customers(id) on delete set null,
  first_ip text,
  last_ip text,
  user_agent text,
  seen_count integer not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table device_fingerprints add column if not exists customer_id bigint references customers(id) on delete set null;

create table if not exists reward_claims (
  id bigserial primary key,
  customer_id bigint not null references customers(id) on delete cascade,
  google_email text,
  google_subject text,
  email text,
  whatsapp_country_code text,
  whatsapp_number text,
  selected_prize_name text,
  selected_prize_image text,
  status text not null default 'pending',
  valid_referrals_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table reward_claims add column if not exists email text;
alter table reward_claims add column if not exists whatsapp_country_code text;
alter table reward_claims add column if not exists whatsapp_number text;
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

create table if not exists social_missions (
  id bigserial primary key,
  customer_id bigint not null references customers(id) on delete cascade,
  mission_key text not null,
  status text not null default 'idle',
  followers_before integer,
  followers_after integer,
  reward_type text,
  reward_value integer not null default 0,
  started_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, mission_key)
);

alter table social_missions add column if not exists followers_before integer;
alter table social_missions add column if not exists followers_after integer;
alter table social_missions add column if not exists reward_type text;
alter table social_missions add column if not exists reward_value integer not null default 0;
alter table social_missions add column if not exists started_at timestamptz;
alter table social_missions add column if not exists verified_at timestamptz;
alter table social_missions add column if not exists updated_at timestamptz not null default now();

insert into rewards (rank_number, name, prize_name, required_referrals, icon_class, is_locked)
values
  (1, 'Bronce', 'Premio Bronce', 3, 'fa-solid fa-medal', false),
  (2, 'Cobre', 'Premio Cobre', 6, 'fa-solid fa-shield-halved', false),
  (3, 'Plata', 'Premio Plata', 9, 'fa-solid fa-gem', false),
  (4, 'Oro', 'Premio Oro', 12, 'fa-solid fa-crown', false)
on conflict (rank_number) do update set
  name = excluded.name,
  prize_name = excluded.prize_name,
  required_referrals = excluded.required_referrals,
  icon_class = excluded.icon_class,
  is_locked = excluded.is_locked;

insert into missions (id, title, reward_points, icon_class, is_active, is_completed)
values
  (1, 'Seguir en Facebook', 50, 'fa-brands fa-facebook-f', true, false),
  (2, 'Seguir en TikTok', 1, 'fa-brands fa-tiktok', true, false),
  (3, 'Seguir en Instagram', 50, 'fa-brands fa-instagram', true, false),
  (4, 'Tus afiliados llegan a rangos', 100, 'fa-solid fa-users', true, false)
on conflict (id) do update set
  title = excluded.title,
  reward_points = excluded.reward_points,
  icon_class = excluded.icon_class,
  is_active = excluded.is_active,
  is_completed = excluded.is_completed;

update referrals set status = 'valid' where status = 'validado';
update reward_claims set status = 'pending' where status = 'pending_google';
