# Graphite Detailing — сбор заявок (PWA)

React 19 + Vite + Tailwind 4 + Supabase. Премиальный dark UI для студии детейлинга и оклейки.

```bash
npm install
npm run dev      # локально
npm run build    # tsc -b && vite build
```

Клиент выбирает услугу и оставляет имя, телефон и авто — без даты и времени. Заявки уходят в Telegram и в таблицу `detailing_leads` (выполните `detailing_leads.sql` в Supabase).

Переменные окружения: `.env` → `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`;
в Vercel для уведомлений — `TG_BOT_TOKEN`, `TG_CHAT_ID`.

## Настройка студии

Всё редактируется в `src/business.json`: название, контакты, акцентный цвет (`themeColor`),
часы работы, боксы, услуги, классы авто, допы. Админка — `/#admin`.

Услуга задаёт длительность одним из полей:
- `durationMinutes` — в пределах рабочего дня (мойка, химчистка);
- `durationDays` — многодневная работа (PPF, оклейка): авто принимают в окне `multiDay.dropOffFrom–dropOffTo`,
  выдают в `multiDay.handoverTime` последнего рабочего дня.

Каждому боксу нужна своя строка в `businesses` — см. `boxes_setup.sql`.
