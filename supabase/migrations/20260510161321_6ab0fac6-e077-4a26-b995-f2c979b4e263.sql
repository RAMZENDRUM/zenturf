
-- ENUMS
create type public.app_role as enum ('user', 'owner', 'admin');
create type public.venue_type as enum ('turf', 'court', 'auditorium');
create type public.payment_status as enum ('pending', 'paid', 'refunded');
create type public.booking_status as enum ('confirmed', 'cancelled', 'completed');

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone text,
  email text,
  avatar_url text,
  wallet_credits numeric not null default 0,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- USER ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

create policy "Roles viewable by self or admin"
  on public.user_roles for select
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles"
  on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- HANDLE NEW USER
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  ) on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'user') on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- VENUES
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  type venue_type not null,
  sport_tags text[] not null default '{}',
  description text,
  address text,
  city text,
  lat double precision,
  lng double precision,
  amenities text[] not null default '{}',
  photos text[] not null default '{}',
  price_per_hour numeric not null default 0,
  price_per_day numeric,
  capacity int,
  rating numeric not null default 0,
  total_reviews int not null default 0,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.venues enable row level security;

create policy "Approved venues are public"
  on public.venues for select using (is_approved = true or owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Owners insert own venue"
  on public.venues for insert with check (owner_id = auth.uid());
create policy "Owners update own venue"
  on public.venues for update using (owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Admins delete venue"
  on public.venues for delete using (public.has_role(auth.uid(), 'admin'));

-- SLOTS
create table public.slots (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  is_booked boolean not null default false,
  booked_by uuid references auth.users(id) on delete set null,
  price_override numeric,
  unique (venue_id, date, start_time)
);
alter table public.slots enable row level security;
create index slots_venue_date_idx on public.slots(venue_id, date);

create policy "Slots are public"
  on public.slots for select using (true);
create policy "Owners manage slots"
  on public.slots for all
  using (
    exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid())
    or public.has_role(auth.uid(), 'admin')
  )
  with check (
    exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid())
    or public.has_role(auth.uid(), 'admin')
  );

-- BOOKINGS
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  slot_id uuid not null unique references public.slots(id) on delete cascade,
  sport_type text,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  total_price numeric not null,
  payment_status payment_status not null default 'pending',
  payment_id text,
  booking_ref text not null unique default ('VB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  qr_code_data text,
  group_members jsonb not null default '[]'::jsonb,
  status booking_status not null default 'confirmed',
  cancellation_reason text,
  refund_amount numeric not null default 0,
  created_at timestamptz not null default now()
);
alter table public.bookings enable row level security;
create index bookings_user_idx on public.bookings(user_id);
create index bookings_venue_idx on public.bookings(venue_id);

create policy "Users see own bookings"
  on public.bookings for select
  using (
    user_id = auth.uid()
    or public.has_role(auth.uid(), 'admin')
    or exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid())
  );
create policy "Users create own bookings"
  on public.bookings for insert with check (user_id = auth.uid());
create policy "Users update own bookings"
  on public.bookings for update using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- TRIGGER: lock slot on booking insert; unlock on cancel
create or replace function public.handle_booking_change()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.slots
      set is_booked = true, booked_by = new.user_id
      where id = new.slot_id and is_booked = false;
    if not found then
      raise exception 'Slot is no longer available';
    end if;
  elsif (tg_op = 'UPDATE') then
    if new.status = 'cancelled' and old.status <> 'cancelled' then
      update public.slots set is_booked = false, booked_by = null where id = new.slot_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger booking_lock_slot
  after insert or update on public.bookings
  for each row execute function public.handle_booking_change();

-- REVIEWS
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  booking_id uuid unique references public.bookings(id) on delete set null,
  rating int not null,
  comment text,
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;

-- validation trigger for rating range and completed booking
create or replace function public.validate_review()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.rating < 1 or new.rating > 5 then
    raise exception 'Rating must be 1-5';
  end if;
  if new.booking_id is not null then
    if not exists (
      select 1 from public.bookings b
      where b.id = new.booking_id
        and b.user_id = new.user_id
        and b.venue_id = new.venue_id
        and b.status in ('completed','confirmed')
    ) then
      raise exception 'Review requires a matching booking';
    end if;
  end if;
  return new;
end;
$$;
create trigger review_validate before insert or update on public.reviews
  for each row execute function public.validate_review();

create policy "Reviews are public"
  on public.reviews for select using (true);
create policy "Users insert own review"
  on public.reviews for insert with check (user_id = auth.uid());
create policy "Users update own review"
  on public.reviews for update using (user_id = auth.uid());
create policy "Users delete own review"
  on public.reviews for delete using (user_id = auth.uid());

-- WAITLIST
create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  slot_id uuid references public.slots(id) on delete cascade,
  notified boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.waitlist enable row level security;
create policy "Users manage own waitlist"
  on public.waitlist for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- NOTIFICATIONS
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create index notifications_user_idx on public.notifications(user_id, is_read);
create policy "Users see own notifications"
  on public.notifications for select using (user_id = auth.uid());
create policy "Users update own notifications"
  on public.notifications for update using (user_id = auth.uid());
create policy "System inserts notifications"
  on public.notifications for insert with check (true);

-- FAVOURITES
create table public.favourites (
  user_id uuid not null references auth.users(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, venue_id)
);
alter table public.favourites enable row level security;
create policy "Users manage own favourites"
  on public.favourites for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- REALTIME
alter publication supabase_realtime add table public.slots;
alter publication supabase_realtime add table public.notifications;
alter table public.slots replica identity full;
alter table public.notifications replica identity full;
