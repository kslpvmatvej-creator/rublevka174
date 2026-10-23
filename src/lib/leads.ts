/** Заявки (таблица rublevka_leads) */
export type LeadStatus = 'new' | 'contacted' | 'done' | 'cancelled'

export type Lead = {
  id: string
  created_at: string
  service_name: string
  client_name: string
  client_phone: string
  vehicle: string
  comment: string | null
  source: string | null
  status: LeadStatus
}

/** Порядок = воронка: Новая → В работе → Завершена / Отменена */
export const STATUSES: { id: LeadStatus; label: string; cls: string; dot: string }[] = [
  { id: 'new', label: 'Новая', cls: 'border-brand/40 bg-brand-soft text-brand-fg', dot: 'bg-brand' },
  { id: 'contacted', label: 'В работе', cls: 'border-amber-400/30 bg-amber-400/10 text-amber-300', dot: 'bg-amber-400' },
  { id: 'done', label: 'Завершена', cls: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300', dot: 'bg-emerald-400' },
  { id: 'cancelled', label: 'Отменена', cls: 'border-white/10 bg-white/5 text-zinc-400', dot: 'bg-zinc-500' },
]

export const statusMeta = (s: LeadStatus) => STATUSES.find((x) => x.id === s) ?? STATUSES[0]

export const NO_SOURCE = 'Не указан'
export const sourceOf = (l: Pick<Lead, 'source'>) => l.source?.trim() || NO_SOURCE
