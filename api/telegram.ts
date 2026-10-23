/**
 * Vercel Serverless Function: уведомление владельцу о новой заявке (лиде) в Telegram.
 *
 * Запрос к api.telegram.org идёт С СЕРВЕРА Vercel (за пределами РФ), поэтому клиенту
 * (браузеру в РФ) никакие прокси/VPN не нужны: он обращается только к вашему домену.
 *
 * Переменные окружения (Vercel → Project → Settings → Environment Variables):
 *   TG_BOT_TOKEN — токен бота от @BotFather (TG_TOKEN тоже работает)
 *   TG_CHAT_ID  — ID чата владельца (число; для группы — отрицательное)
 */

// Минимальные типы, чтобы не тянуть @vercel/node
type Req = { method?: string; body?: unknown }
type Res = {
  status: (code: number) => Res
  setHeader: (name: string, value: string) => void
  json: (body: unknown) => void
}

type Payload = {
  service: string
  /** Цена из прайса как её видел клиент: «от 3 000 ₽» / «После осмотра» */
  priceText?: string
  vehicle: string
  name: string
  phone: string
  /** Комментарий клиента (необязательно) */
  comment?: string
  /** Откуда клиент о нас узнал: «2ГИС», «Instagram», … */
  source?: string
}

/** Экранирование для parse_mode=HTML */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const str = (v: unknown, max: number): string | null =>
  typeof v === 'string' && v.trim() !== '' ? v.trim().slice(0, max) : null

function parse(raw: unknown): Payload | null {
  let body = raw
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return null
    }
  }
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>

  const service = str(b.service, 120)
  const vehicle = str(b.vehicle, 80)
  const name = str(b.name, 100)
  const phone = str(b.phone, 30)
  if (!service || !vehicle || !name || !phone) return null

  return {
    service,
    vehicle,
    name,
    phone,
    priceText: str(b.priceText, 120) ?? undefined,
    comment: str(b.comment, 300) ?? undefined,
    source: str(b.source, 40) ?? undefined,
  }
}

function buildMessage(p: Payload): string {
  const lines = [
    '<b>🔥 Новая заявка!</b>',
    `Услуга: ${esc(p.service)}`,
    `Авто: ${esc(p.vehicle)}`,
    `Клиент: ${esc(p.name)}`,
    `Телефон: ${esc(p.phone)}`,
    // Нет источника — только у устаревшей закэшированной версии сайта; показываем явно, чтобы не потерять строку
    `Источник: ${p.source ? esc(p.source) : 'не указан'}`,
  ]
  if (p.comment) lines.push(`Комментарий: ${esc(p.comment)}`)
  if (p.priceText) lines.push(`Цена по прайсу: ${esc(p.priceText)}`)
  return lines.join('\n')
}

export default async function handler(req: Req, res: Res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const token = process.env.TG_BOT_TOKEN ?? process.env.TG_TOKEN
  const chatId = process.env.TG_CHAT_ID
  if (!token || !chatId) {
    console.error('telegram: TG_BOT_TOKEN или TG_CHAT_ID не заданы')
    return res.status(500).json({ ok: false, error: 'Server is not configured' })
  }

  const payload = parse(req.body)
  if (!payload) return res.status(400).json({ ok: false, error: 'Bad request' })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildMessage(payload),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    })
    if (!tg.ok) {
      // Тело ответа Telegram в логи, но не клиенту (в нём может быть служебная информация)
      console.error('telegram: sendMessage failed', tg.status, await tg.text().catch(() => ''))
      return res.status(502).json({ ok: false, error: 'Telegram error' })
    }
    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('telegram: request failed', e)
    return res.status(502).json({ ok: false, error: 'Telegram unreachable' })
  } finally {
    clearTimeout(timer)
  }
}
