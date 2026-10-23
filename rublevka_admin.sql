-- ============================================================
-- Rublevka174: заявки (rublevka_leads) и настройки скидки (rublevka_settings)
-- Выполнить целиком в Supabase → SQL Editor. Скрипт идемпотентный.
--
-- anon        : может только ДОБАВЛЯТЬ заявки и читать настройки скидки
-- владелец    : вошёл в админку под rublevka174@rub.ru → читает/меняет заявки и скидку
-- ============================================================

-- ---------- Заявки ----------
create table if not exists public.rublevka_leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  service_name  text        not null,
  client_name   text        not null,
  client_phone  text        not null,
  vehicle       text        not null,
  comment       text,
  source        text,
  status        text        not null default 'new'   -- new | contacted | done | cancelled
);

-- Если таблица уже была создана раньше с другим набором колонок — докидываем недостающие
alter table public.rublevka_leads add column if not exists created_at   timestamptz not null default now();
alter table public.rublevka_leads add column if not exists service_name text;
alter table public.rublevka_leads add column if not exists client_name  text;
alter table public.rublevka_leads add column if not exists client_phone text;
alter table public.rublevka_leads add column if not exists vehicle      text;
alter table public.rublevka_leads add column if not exists comment      text;
alter table public.rublevka_leads add column if not exists source       text;
alter table public.rublevka_leads add column if not exists status       text not null default 'new';

-- Ограничения длины (совпадают с тем, что режет api/telegram.ts)
alter table public.rublevka_leads drop constraint if exists rublevka_leads_len;
alter table public.rublevka_leads add constraint rublevka_leads_len check (
  char_length(client_name)  between 2 and 100
  and char_length(client_phone) between 5 and 30
  and char_length(vehicle)      between 2 and 80
  and char_length(service_name) between 1 and 120
  and (comment is null or char_length(comment) <= 300)
  and (source  is null or char_length(source)  between 1 and 40)
);

create index if not exists rublevka_leads_created_idx on public.rublevka_leads (created_at desc);
create index if not exists rublevka_leads_source_idx  on public.rublevka_leads (source);

alter table public.rublevka_leads enable row level security;

-- Очищаем возможные старые политики, чтобы не конфликтовали
drop policy if exists "leads_insert_anon"   on public.rublevka_leads;
drop policy if exists "leads_owner_select"  on public.rublevka_leads;
drop policy if exists "leads_owner_update"  on public.rublevka_leads;

-- Клиент (не вошедший в систему) — только создание новой заявки
create policy "leads_insert_anon" on public.rublevka_leads
  for insert to anon, authenticated
  with check (status = 'new');

-- Владелец (по email из JWT) — просмотр и смена статуса
create policy "leads_owner_select" on public.rublevka_leads
  for select to authenticated
  using (lower(auth.jwt() ->> 'email') = 'rublevka174@rub.ru');

create policy "leads_owner_update" on public.rublevka_leads
  for update to authenticated
  using      (lower(auth.jwt() ->> 'email') = 'rublevka174@rub.ru')
  with check (lower(auth.jwt() ->> 'email') = 'rublevka174@rub.ru');

-- Права на уровне таблицы (без них RLS даже не вызывается: будет "permission denied")
revoke all on public.rublevka_leads from anon, authenticated;
grant insert         on public.rublevka_leads to anon, authenticated;
grant select, update on public.rublevka_leads to authenticated;

-- ---------- Настройки (глобальная скидка) ----------
create table if not exists public.rublevka_settings (
  id               int primary key,
  discount_enabled boolean     not null default false,
  discount_percent int         not null default 10 check (discount_percent between 1 and 90),
  updated_at       timestamptz not null default now()
);

insert into public.rublevka_settings (id) values (1) on conflict (id) do nothing;

alter table public.rublevka_settings enable row level security;

drop policy if exists "settings_read_all"     on public.rublevka_settings;
drop policy if exists "settings_owner_update" on public.rublevka_settings;

create policy "settings_read_all" on public.rublevka_settings
  for select to anon, authenticated
  using (true);

create policy "settings_owner_update" on public.rublevka_settings
  for update to authenticated
  using      (lower(auth.jwt() ->> 'email') = 'rublevka174@rub.ru')
  with check (lower(auth.jwt() ->> 'email') = 'rublevka174@rub.ru');

revoke all on public.rublevka_settings from anon, authenticated;
grant select         on public.rublevka_settings to anon, authenticated;
grant update         on public.rublevka_settings to authenticated;

notify pgrst, 'reload schema';

-- ------------------------------------------------------------
-- Проверка (в SQL Editor): таблица есть, политики на месте
--   select tablename, policyname, cmd, roles from pg_policies
--   where tablename in ('rublevka_leads', 'rublevka_settings');
-- ------------------------------------------------------------
