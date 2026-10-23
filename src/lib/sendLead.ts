import { supabase } from '../supabaseClient'

/**
 * Отправка заявки без ожидания клиентом.
 *
 * Форма показывает «Готово» сразу, а доставка идёт в фоне параллельно в два канала:
 *  - Supabase (rublevka_leads),
 *  - Telegram через /api/telegram.
 * Если канал не ответил (нет сети, холодный старт функции, ошибка) — заявка остаётся
 * в localStorage и дошлётся при следующем заходе на сайт или когда вернётся сеть.
 * Успешные каналы повторно не вызываются, поэтому дублей не будет.
 */

export type LeadPayload = {
  service: string
  priceText?: string
  name: string
  phone: string
  vehicle: string
  source: string | null
  comment?: string
}

type OutboxItem = {
  id: string
  at: number
  payload: LeadPayload
  tgDone: boolean
  dbDone: boolean
  attempts: number
}

const KEY = 'rublevka_lead_outbox'
const MAX_ATTEMPTS = 8
const MAX_AGE_MS = 1000 * 60 * 60 * 48
const TG_TIMEOUT_MS = 15000

const readOutbox = (): OutboxItem[] => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as OutboxItem[]) : []
  } catch {
    return []
  }
}

const writeOutbox = (items: OutboxItem[]) => {
  try {
    if (items.length) localStorage.setItem(KEY, JSON.stringify(items))
    else localStorage.removeItem(KEY)
  } catch {
    /* приватный режим / переполнено — работаем без очереди */
  }
}

async function toTelegram(p: LeadPayload): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TG_TIMEOUT_MS)
  try {
    const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify_rublevka`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // keepalive: запрос доедет, даже если клиент сразу закроет вкладку
      keepalive: true,
      signal: controller.signal,
      body: JSON.stringify({
        service: p.service,
        priceText: p.priceText,
        name: p.name,
        phone: p.phone,
        vehicle: p.vehicle,
        source: p.source,
        ...(p.comment ? { comment: p.comment } : {}),
      }),
    })
    if (!r.ok) console.error('telegram notify failed', r.status)
    return r.ok
  } catch (e) {
    console.error('telegram notify failed', e)
    return false
  } finally {
    clearTimeout(timer)
  }
}

async function toDb(p: LeadPayload): Promise<boolean> {
  try {
    // Без .select(): у anon есть право только добавлять, читать таблицу он не может
    const { error } = await supabase.from('rublevka_leads').insert({
      service_name: p.service,
      client_name: p.name,
      client_phone: p.phone,
      vehicle: p.vehicle,
      comment: p.comment || null,
      source: p.source,
      status: 'new',
    })
    if (error) {
      // code/message/details покажут точную причину (42501 — RLS/GRANT, 42P01/PGRST205 — нет таблицы,
      // 23514 — не прошёл CHECK, 23502 — NOT NULL колонка)
      console.error('lead save failed', error.code, error.message, error.details, error.hint)
      return false
    }
    return true
  } catch (e) {
    console.error('lead save failed', e)
    return false
  }
}

/** Один проход по очереди: дошлём только те каналы, что ещё не отработали */
async function processItem(item: OutboxItem): Promise<OutboxItem | null> {
  const [tg, db] = await Promise.all([
    item.tgDone ? true : toTelegram(item.payload),
    item.dbDone ? true : toDb(item.payload),
  ])
  const next = { ...item, tgDone: tg, dbDone: db, attempts: item.attempts + 1 }
  const finished = next.tgDone && next.dbDone
  const giveUp = next.attempts >= MAX_ATTEMPTS || Date.now() - next.at > MAX_AGE_MS
  return finished || giveUp ? null : next
}

let flushing = false
let again = false

/** Дослать то, что не ушло раньше. Безопасно вызывать сколько угодно раз */
export async function flushOutbox(): Promise<void> {
  if (flushing) {
    again = true // пока идёт отправка, появилась новая заявка — после неё пройдём очередь ещё раз
    return
  }
  flushing = true
  try {
    const items = readOutbox()
    if (!items.length) return
    const left: OutboxItem[] = []
    for (const item of items) {
      const rest = await processItem(item)
      if (rest) left.push(rest)
    }
    // Могли добавить новую заявку, пока шла отправка — не затираем её
    const ids = new Set(items.map((i) => i.id))
    writeOutbox([...left, ...readOutbox().filter((i) => !ids.has(i.id))])
  } finally {
    flushing = false
    if (again) {
      again = false
      void flushOutbox()
    }
  }
}

/**
 * Принять заявку: мгновенно кладём в очередь и запускаем отправку в фоне.
 * Не бросает исключений и не заставляет ждать ответа серверов.
 */
export function submitLead(payload: LeadPayload): void {
  const item: OutboxItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
    payload,
    tgDone: false,
    dbDone: false,
    attempts: 0,
  }
  writeOutbox([...readOutbox(), item])
  void flushOutbox()
}

/** Подписка на возврат сети и дослать хвост при загрузке сайта */
export function startOutboxRetry(): void {
  void flushOutbox()
  window.addEventListener('online', () => void flushOutbox())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void flushOutbox()
  })
}
