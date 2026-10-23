import { useMemo, type ReactNode } from 'react'
import { format, isToday, startOfMonth, subMonths } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ArrowUpRight, BellRing, CalendarDays, CircleCheck, Inbox, TrendingDown, TrendingUp } from 'lucide-react'

import { cn } from '../../lib/cn'
import { formatPhone } from '../../lib/format'
import { NO_SOURCE, sourceOf, statusMeta, type Lead, type LeadStatus } from '../../lib/leads'
import { plural } from '../../lib/plural'

type Props = {
  leads: Lead[]
  loading: boolean
  /** Переход в CRM, опционально сразу с фильтром по статусу */
  onOpenLeads: (status?: LeadStatus | 'all') => void
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  onClick,
}: {
  icon: typeof Inbox
  label: string
  value: number | string
  hint?: ReactNode
  accent?: boolean
  onClick?: () => void
}) {
  const cls = cn(
    'glass relative flex min-w-0 flex-col gap-3 overflow-hidden rounded-3xl p-4 text-left md:p-5',
    onClick && 'transition hover:bg-white/[0.06] active:scale-[0.99]',
    accent && 'ring-1 ring-brand/40'
  )
  const content = (
    <>
      {accent && <div aria-hidden className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-brand/20 blur-2xl" />}
      <span className="flex items-center gap-2 text-xs font-medium text-zinc-400">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-brand-fg ring-1 ring-white/10">
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        </span>
        {label}
      </span>
      <span className="text-4xl font-semibold leading-none tracking-tight text-white tabular-nums">{value}</span>
      {hint && <span className="text-xs leading-snug text-zinc-500">{hint}</span>}
    </>
  )
  return onClick ? (
    <button type="button" onClick={onClick} className={cls}>
      {content}
    </button>
  ) : (
    <div className={cls}>{content}</div>
  )
}

/** Главный экран админки: заявки за месяц, источники, последние заявки */
export default function Dashboard({ leads, loading, onOpenLeads }: Props) {
  const now = new Date()

  const stats = useMemo(() => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const prevStart = startOfMonth(subMonths(now, 1))
    const inMonth = leads.filter((l) => new Date(l.created_at) >= monthStart)
    const prevCount = leads.filter((l) => {
      const d = new Date(l.created_at)
      return d >= prevStart && d < monthStart
    }).length

    const bySource = new Map<string, number>()
    for (const l of inMonth) bySource.set(sourceOf(l), (bySource.get(sourceOf(l)) ?? 0) + 1)
    // «Не указан» всегда в конце, остальные по убыванию
    const sources = [...bySource.entries()].sort((a, b) =>
      a[0] === NO_SOURCE ? 1 : b[0] === NO_SOURCE ? -1 : b[1] - a[1]
    )

    return {
      month: inMonth.length,
      prev: prevCount,
      done: inMonth.filter((l) => l.status === 'done').length,
      today: leads.filter((l) => isToday(new Date(l.created_at))).length,
      fresh: leads.filter((l) => l.status === 'new').length,
      sources,
    }
  }, [leads])

  const monthLabel = format(now, 'LLLL yyyy', { locale: ru })
  const delta = stats.month - stats.prev
  const maxSource = Math.max(1, ...stats.sources.map(([, n]) => n))
  const recent = leads.slice(0, 5)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 md:gap-4">
        <StatCard
          icon={Inbox}
          label="Заявок за месяц"
          value={loading ? '…' : stats.month}
          accent
          hint={
            <span className="flex flex-wrap items-center gap-x-1.5">
              <span className="capitalize">{monthLabel}</span>
              {stats.prev > 0 || stats.month > 0 ? (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 font-medium',
                    delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-zinc-400'
                  )}
                >
                  {delta > 0 ? <TrendingUp className="h-3 w-3" /> : delta < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                  {delta > 0 ? `+${delta}` : delta} к прошлому ({stats.prev})
                </span>
              ) : null}
            </span>
          }
        />
        <StatCard
          icon={BellRing}
          label="Новые"
          value={loading ? '…' : stats.fresh}
          hint={stats.fresh > 0 ? 'Ждут звонка — открыть' : 'Все заявки обработаны'}
          onClick={() => onOpenLeads('new')}
        />
        <StatCard icon={CalendarDays} label="Сегодня" value={loading ? '…' : stats.today} hint={`${plural(stats.today, 'заявка', 'заявки', 'заявок')} за сегодня`} />
        <StatCard
          icon={CircleCheck}
          label="Завершено за месяц"
          value={loading ? '…' : stats.done}
          hint={stats.month > 0 ? `${Math.round((stats.done / stats.month) * 100)}% от заявок месяца` : 'Пока нет заявок'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Источники */}
        <section className="glass rounded-3xl p-4 md:p-5 lg:col-span-3" aria-labelledby="sources-title">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="sources-title" className="text-base font-semibold tracking-tight text-white">
              Откуда приходят клиенты
            </h2>
            <span className="text-xs capitalize text-zinc-500">{monthLabel}</span>
          </div>

          {stats.sources.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">{loading ? 'Загружаем…' : 'В этом месяце заявок ещё не было'}</p>
          ) : (
            <ul className="mt-4 space-y-3.5">
              {stats.sources.map(([name, n]) => {
                const share = Math.round((n / stats.month) * 100)
                return (
                  <li key={name}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className={cn('min-w-0 truncate', name === NO_SOURCE ? 'text-zinc-500' : 'font-medium text-zinc-100')}>{name}</span>
                      <span className="shrink-0 tabular-nums text-zinc-400">
                        <span className="font-semibold text-white">{n}</span> · {share}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className={cn('h-full rounded-full', name === NO_SOURCE ? 'bg-zinc-600' : 'bg-brand')}
                        style={{ width: `${Math.max(4, (n / maxSource) * 100)}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Последние заявки */}
        <section className="glass rounded-3xl p-4 md:p-5 lg:col-span-2" aria-labelledby="recent-title">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="recent-title" className="text-base font-semibold tracking-tight text-white">
              Последние заявки
            </h2>
            <button
              type="button"
              onClick={() => onOpenLeads('all')}
              className="inline-flex items-center gap-0.5 text-xs font-medium text-brand-fg transition hover:text-white"
            >
              Все <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">{loading ? 'Загружаем…' : 'Заявок пока нет'}</p>
          ) : (
            <ul className="mt-3 divide-y divide-white/5">
              {recent.map((l) => {
                const meta = statusMeta(l.status)
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => onOpenLeads(l.status)}
                      className="flex w-full items-center gap-3 py-3 text-left transition hover:opacity-80"
                    >
                      <span className={cn('h-2 w-2 shrink-0 rounded-full', meta.dot)} aria-label={meta.label} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-zinc-100">{l.client_name}</span>
                        <span className="block truncate text-xs text-zinc-500">
                          {l.service_name} · {l.vehicle}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-xs text-zinc-400">{format(new Date(l.created_at), 'd MMM, HH:mm', { locale: ru })}</span>
                        <span className="block text-[11px] tabular-nums text-zinc-600">{formatPhone(l.client_phone)}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
