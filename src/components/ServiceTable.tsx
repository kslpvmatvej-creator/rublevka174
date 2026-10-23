import { useMemo, useState } from 'react'

import CornerArrow from './CornerArrow'
import PriceTag from './PriceTag'
import { SERVICES, resolveIcon } from '../lib/catalog'
import { cn } from '../lib/cn'

const ALL = 'all'
const CATEGORIES = [...new Set(SERVICES.map((s) => s.category).filter((c): c is string => !!c))]

type Props = {
  /** Клик по строке: открывает шторку заявки с этой услугой */
  onBook: (serviceId: string) => void
}

/** Прайс строгой таблицей: одна строка на услугу, фильтр по категории чипами */
export default function ServiceTable({ onBook }: Props) {
  const [category, setCategory] = useState<string>(ALL)
  const rows = useMemo(() => (category === ALL ? SERVICES : SERVICES.filter((s) => s.category === category)), [category])

  return (
    <section id="services" className="scroll-mt-4" aria-labelledby="services-title">
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-baseline gap-3 px-1">
          <h2 id="services-title" className="text-xl font-semibold tracking-tight text-white">
            Услуги
          </h2>
          <p className="text-xs text-zinc-500">Ориентировочная стоимость — точную назовёт мастер после уточнения деталей</p>
        </div>

        {CATEGORIES.length > 1 && (
          <div
            role="tablist"
            aria-label="Категории услуг"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden"
          >
            {[ALL, ...CATEGORIES].map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={category === c}
                onClick={() => setCategory(c)}
                className={cn(
                  'h-9 shrink-0 rounded-full border px-4 text-[13px] font-medium transition active:scale-95',
                  category === c
                    ? 'border-white bg-white text-black'
                    : 'border-white/5 bg-zinc-900/40 text-zinc-400 hover:border-white/15 hover:text-white'
                )}
              >
                {c === ALL ? 'Все' : c}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="glass overflow-hidden rounded-3xl">
        {/* Шапка таблицы — только на широких экранах */}
        <div className="hidden grid-cols-[2.25rem_1fr_9rem_2rem] items-center gap-x-4 border-b border-white/5 px-5 py-3 text-[11px] text-zinc-500 md:grid">
          <span />
          <span>Услуга</span>
          <span className="text-right">Цена</span>
          <span />
        </div>

        <ul className="divide-y divide-white/5">
          {rows.map((s) => {
            const Icon = resolveIcon(s.icon)
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onBook(s.id)}
                  className="group grid w-full grid-cols-[2.25rem_1fr_auto] items-center gap-x-4 px-4 py-3.5 text-left transition-colors duration-200 hover:bg-white/[0.04] md:grid-cols-[2.25rem_1fr_9rem_2rem] md:px-5"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/5 bg-white/[0.04] text-zinc-300 transition-colors group-hover:text-brand-fg">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>

                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[15px] font-medium text-white">{s.name}</span>
                      {s.badge && (
                        <span className="hidden shrink-0 rounded-full border border-brand/30 bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand-fg sm:inline">
                          {s.badge}
                        </span>
                      )}
                    </span>
                    {s.description && (
                      <span className="mt-0.5 hidden truncate text-xs text-zinc-500 md:block">{s.description}</span>
                    )}
                  </span>

                  <span className="max-w-[8rem] text-right md:max-w-none">
                    <PriceTag service={s} className="text-[15px] font-semibold leading-tight tabular-nums text-white" />
                  </span>

                  <CornerArrow className="hidden md:flex" />
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
