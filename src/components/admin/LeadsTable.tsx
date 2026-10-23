import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Car, ChevronDown, Inbox, Loader2, MessageSquare, Phone, Search, Wrench } from 'lucide-react'

import { cn } from '../../lib/cn'
import { formatPhone, telHref } from '../../lib/format'
import { NO_SOURCE, STATUSES, sourceOf, statusMeta, type Lead, type LeadStatus } from '../../lib/leads'

export type LeadFilter = LeadStatus | 'all'

type Props = {
  leads: Lead[]
  loading: boolean
  filter: LeadFilter
  onFilter: (f: LeadFilter) => void
  onStatus: (lead: Lead, status: LeadStatus) => void
  busyId: string | null
}

/** Выпадающий список статуса: нативный select (удобно на телефоне), оформлен как цветная таблетка */
function StatusSelect({ lead, busy, onChange }: { lead: Lead; busy: boolean; onChange: (s: LeadStatus) => void }) {
  const meta = statusMeta(lead.status)
  return (
    <label className={cn('relative inline-flex h-9 items-center rounded-full border text-sm font-medium', meta.cls, busy && 'opacity-60')}>
      <span className="sr-only">Статус заявки {lead.client_name}</span>
      <select
        value={lead.status}
        disabled={busy}
        onChange={(e) => onChange(e.target.value as LeadStatus)}
        className="h-full cursor-pointer appearance-none rounded-full bg-transparent pl-3.5 pr-8 outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        {STATUSES.map((s) => (
          <option key={s.id} value={s.id} className="bg-zinc-900 text-zinc-100">
            {s.label}
          </option>
        ))}
      </select>
      {busy ? (
        <Loader2 className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 animate-spin" />
      ) : (
        <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 opacity-70" />
      )}
    </label>
  )
}

const when = (iso: string) => format(new Date(iso), 'd MMM, HH:mm', { locale: ru })

/** CRM: заявки из rublevka_leads — поиск, фильтры, смена статуса */
export default function LeadsTable({ leads, loading, filter, onFilter, onStatus, busyId }: Props) {
  const [query, setQuery] = useState('')
  const [source, setSource] = useState<string>('all')

  const sources = useMemo(() => [...new Set(leads.map(sourceOf))].sort((a, b) => (a === NO_SOURCE ? 1 : b === NO_SOURCE ? -1 : a.localeCompare(b, 'ru'))), [leads])

  const counts = useMemo(() => {
    const c: Record<LeadFilter, number> = { all: leads.length, new: 0, contacted: 0, done: 0, cancelled: 0 }
    for (const l of leads) c[l.status] += 1
    return c
  }, [leads])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const qDigits = q.replace(/\D/g, '')
    return leads.filter((l) => {
      if (filter !== 'all' && l.status !== filter) return false
      if (source !== 'all' && sourceOf(l) !== source) return false
      if (!q) return true
      return (
        l.client_name.toLowerCase().includes(q) ||
        l.vehicle.toLowerCase().includes(q) ||
        l.service_name.toLowerCase().includes(q) ||
        (l.comment ?? '').toLowerCase().includes(q) ||
        (qDigits.length >= 3 && l.client_phone.replace(/\D/g, '').includes(qDigits))
      )
    })
  }, [leads, filter, source, query])

  const chips: { id: LeadFilter; label: string }[] = [{ id: 'all', label: 'Все' }, ...STATUSES.map((s) => ({ id: s.id as LeadFilter, label: s.label }))]

  return (
    <section aria-label="Заявки" className="space-y-3">
      {/* Фильтры */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div role="tablist" aria-label="Статус заявки" className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={filter === c.id}
              onClick={() => onFilter(c.id)}
              className={cn(
                'flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[13px] font-medium transition active:scale-95',
                filter === c.id ? 'border-white bg-white text-black' : 'border-white/5 bg-zinc-900/40 text-zinc-400 hover:border-white/15 hover:text-white'
              )}
            >
              {c.label}
              <span className={cn('tabular-nums', filter === c.id ? 'text-black/60' : 'text-zinc-600')}>{counts[c.id]}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <label className="glass flex h-10 min-w-0 flex-1 items-center gap-2 rounded-2xl px-3 focus-within:ring-2 focus-within:ring-brand md:w-64 md:flex-none">
            <Search className="h-4 w-4 shrink-0 text-zinc-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Имя, телефон, авто…"
              aria-label="Поиск по заявкам"
              className="w-full min-w-0 bg-transparent text-base outline-none placeholder:text-zinc-600 md:text-sm"
            />
          </label>
          {sources.length > 1 && (
            <label className="glass relative flex h-10 items-center rounded-2xl">
              <span className="sr-only">Источник</span>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="h-full max-w-[9.5rem] cursor-pointer appearance-none truncate rounded-2xl bg-transparent pl-3 pr-8 text-base text-zinc-200 outline-none focus-visible:ring-2 focus-visible:ring-brand md:text-sm"
              >
                <option value="all" className="bg-zinc-900">Все источники</option>
                {sources.map((s) => (
                  <option key={s} value={s} className="bg-zinc-900">
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-zinc-500" />
            </label>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="glass flex flex-col items-center gap-2 rounded-3xl px-6 py-14 text-center">
          <Inbox className="h-8 w-8 text-zinc-600" strokeWidth={1.5} />
          <p className="text-sm font-medium text-zinc-300">{loading ? 'Загружаем заявки…' : leads.length === 0 ? 'Заявок пока нет' : 'Ничего не найдено'}</p>
          {!loading && leads.length === 0 && (
            <p className="max-w-sm text-xs text-zinc-500">
              Если заявки точно есть в базе, но здесь пусто — проверьте, что вы вошли под email владельца, указанным в rublevka_admin.sql.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Телефон и планшет: карточки */}
          <ul className="space-y-3 lg:hidden">
            {rows.map((l) => (
              <li key={l.id} className={cn('glass rounded-3xl p-4', l.status === 'new' && 'ring-1 ring-brand/40')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-white">{l.client_name}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {when(l.created_at)} · {sourceOf(l)}
                    </p>
                  </div>
                  <StatusSelect lead={l} busy={busyId === l.id} onChange={(s) => onStatus(l, s)} />
                </div>

                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex items-start gap-2.5">
                    <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" strokeWidth={1.75} />
                    <dd className="text-zinc-200">{l.service_name}</dd>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Car className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" strokeWidth={1.75} />
                    <dd className="text-zinc-200">{l.vehicle}</dd>
                  </div>
                  {l.comment && (
                    <div className="flex items-start gap-2.5">
                      <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" strokeWidth={1.75} />
                      <dd className="whitespace-pre-wrap break-words text-zinc-300">{l.comment}</dd>
                    </div>
                  )}
                </dl>

                <a
                  href={telHref(l.client_phone)}
                  className="mt-4 flex h-11 items-center justify-center gap-2 rounded-2xl bg-brand text-sm font-semibold text-brand-contrast transition hover:brightness-110 active:scale-[0.98]"
                >
                  <Phone className="h-4 w-4" /> {formatPhone(l.client_phone)}
                </a>
              </li>
            ))}
          </ul>

          {/* Десктоп: таблица */}
          <div className="glass hidden overflow-hidden rounded-3xl lg:block">
            <table className="w-full table-fixed border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-zinc-500">
                  <th className="w-[8.5rem] px-4 py-3 font-medium">Дата</th>
                  <th className="w-[13rem] px-4 py-3 font-medium">Клиент</th>
                  <th className="w-[10rem] px-4 py-3 font-medium">Авто</th>
                  <th className="w-[11rem] px-4 py-3 font-medium">Услуга</th>
                  <th className="px-4 py-3 font-medium">Комментарий</th>
                  <th className="w-[8.5rem] px-4 py-3 font-medium">Источник</th>
                  <th className="w-[10.5rem] px-4 py-3 font-medium">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((l) => (
                  <tr key={l.id} className="align-top transition-colors hover:bg-white/[0.03]">
                    <td className="px-4 py-3.5 text-zinc-400">
                      <span className="flex items-center gap-2">
                        {l.status === 'new' && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-label="Новая" />}
                        {when(l.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="block truncate font-medium text-white">{l.client_name}</span>
                      <a href={telHref(l.client_phone)} className="text-xs tabular-nums text-brand-fg hover:underline">
                        {formatPhone(l.client_phone)}
                      </a>
                    </td>
                    <td className="break-words px-4 py-3.5 text-zinc-200">{l.vehicle}</td>
                    <td className="break-words px-4 py-3.5 text-zinc-200">{l.service_name}</td>
                    <td className="whitespace-pre-wrap break-words px-4 py-3.5 text-zinc-300">{l.comment || <span className="text-zinc-600">—</span>}</td>
                    <td className={cn('break-words px-4 py-3.5', l.source ? 'text-zinc-200' : 'text-zinc-600')}>{sourceOf(l)}</td>
                    <td className="px-4 py-3">
                      <StatusSelect lead={l} busy={busyId === l.id} onChange={(s) => onStatus(l, s)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
