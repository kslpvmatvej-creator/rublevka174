-- ============================================================
-- detailing_leads: заявки («горячие» лиды) без даты и времени.
-- Выполните в Supabase → SQL Editor.
--
-- Клиент (anon) может только ДОБАВЛЯТЬ заявки; читать и менять их может
-- только владелец студии (businesses.owner_id = auth.uid()).
-- Старая таблица detailing_bookings не затрагивается.
-- ============================================================

create table if not exists public.detailing_leads (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses (id) on delete cascade,
  service_id    text,
  service_name  text        not null,
  client_name   text        not null,
  client_phone  text        not null,
  vehicle       text        not null,
  comment       text,
  source        text,                                  -- откуда узнал: 2ГИС / Instagram / …
  status        text        not null default 'new',   -- new | contacted | done | cancelled
  created_at    timestamptz not null default now(),
  constraint detailing_leads_len check (
    char_length(client_name) between 2 and 100
    and char_length(client_phone) between 5 and 30
    and char_length(vehicle) between 2 and 80
    and char_length(service_name) between 1 and 120
  )
);

-- Если таблицу создавали раньше, без комментария — добавляем колонку и лимит длины
alter table public.detailing_leads add column if not exists comment text;
alter table public.detailing_leads drop constraint if exists detailing_leads_comment_len;
alter table public.detailing_leads
  add constraint detailing_leads_comment_len check (comment is null or char_length(comment) <= 300);

alter table public.detailing_leads add column if not exists source text;
alter table public.detailing_leads drop constraint if exists detailing_leads_source_len;
alter table public.detailing_leads
  add constraint detailing_leads_source_len check (source is null or char_length(source) between 1 and 40);

create index if not exists detailing_leads_source_idx
  on public.detailing_leads (business_id, source);

create index if not exists detailing_leads_business_created_idx
  on public.detailing_leads (business_id, created_at desc);

alter table public.detailing_leads enable row level security;

-- Клиенты: только создание новых заявок
drop policy if exists "leads_insert_anon" on public.detailing_leads;
create policy "leads_insert_anon" on public.detailing_leads
  for insert to anon, authenticated
  with check (status = 'new');

-- Владелец: просмотр и смена статуса
drop policy if exists "leads_owner_select" on public.detailing_leads;
create policy "leads_owner_select" on public.detailing_leads
  for select to authenticated
  using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()));

drop policy if exists "leads_owner_update" on public.detailing_leads;
create policy "leads_owner_update" on public.detailing_leads
  for update to authenticated
  using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()));

grant insert on public.detailing_leads to anon, authenticated;
grant select, update on public.detailing_leads to authenticated;

notify pgrst, 'reload schema';

-- ------------------------------------------------------------
-- Какие каналы приносят заявки (запускать под владельцем в SQL Editor):
--   select coalesce(source, 'не указан') as source, count(*) as leads
--   from public.detailing_leads
--   where created_at > now() - interval '30 days'
--   group by 1 order by leads desc;
-- ------------------------------------------------------------
