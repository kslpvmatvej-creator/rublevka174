import { useEffect, useState } from 'react'
import { Check, Loader2, Percent, TriangleAlert } from 'lucide-react'

import { SERVICES } from '../../lib/catalog'
import { cn } from '../../lib/cn'
import { formatPrice } from '../../lib/format'
import { PROMO_MAX, PROMO_MIN, applyDiscount, savePromo, usePromo } from '../../lib/promo'

const QUICK = [5, 10, 15, 20, 30]

/** Маркетинг: глобальная скидка. Сохраняется в rublevka_settings и сразу применяется на сайте */
export default function Marketing() {
  const promo = usePromo()
  const [enabled, setEnabled] = useState(promo.enabled)
  const [percentText, setPercentText] = useState(String(promo.percent))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState(false)

  // Подтянулось из базы или сохранилось — черновик совпадает с актуальным значением
  useEffect(() => {
    setEnabled(promo.enabled)
    setPercentText(String(promo.percent))
  }, [promo.enabled, promo.percent])

  const percent = Number(percentText)
  const valid = Number.isInteger(percent) && percent >= PROMO_MIN && percent <= PROMO_MAX
  const dirty = enabled !== promo.enabled || (valid && percent !== promo.percent)

  const example = SERVICES.find((s) => s.price > 0 && !s.priceLabel)

  const save = async () => {
    if (!valid || saving) return
    setSaving(true)
    setError(null)
    setSavedAt(false)
    const err = await savePromo({ enabled, percent })
    setSaving(false)
    if (err) setError(err)
    else setSavedAt(true)
  }

  return (
    <section aria-labelledby="promo-title" className="grid gap-4 lg:grid-cols-5">
      <div className="glass rounded-3xl p-5 lg:col-span-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="promo-title" className="text-lg font-semibold tracking-tight text-white">
              Глобальная скидка
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">
              На сайте цены всех услуг перечёркиваются, рядом показывается новая цена. Скидка не касается услуг с текстовой ценой («Индивидуальный расчёт», «После осмотра»).
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Глобальная скидка"
            onClick={() => {
              setEnabled((v) => !v)
              setSavedAt(false)
            }}
            className={cn(
              'relative h-8 w-14 shrink-0 rounded-full border transition-colors active:scale-95',
              enabled ? 'border-brand bg-brand' : 'border-white/10 bg-zinc-800'
            )}
          >
            <span className={cn('absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200', enabled && 'translate-x-6')} />
          </button>
        </div>

        <div className={cn('mt-6 transition-opacity', !enabled && 'opacity-50')}>
          <label htmlFor="promo-percent" className="mb-2.5 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
            Размер скидки
          </label>
          <div className="flex items-center gap-3">
            <div className="glass flex h-14 w-36 items-center rounded-2xl px-4 focus-within:ring-2 focus-within:ring-brand">
              <input
                id="promo-percent"
                type="number"
                inputMode="numeric"
                min={PROMO_MIN}
                max={PROMO_MAX}
                step={1}
                value={percentText}
                onChange={(e) => {
                  setPercentText(e.target.value)
                  setSavedAt(false)
                }}
                className="w-full min-w-0 bg-transparent text-2xl font-semibold tabular-nums text-white outline-none"
              />
              <Percent className="h-5 w-5 shrink-0 text-zinc-500" />
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setPercentText(String(q))
                    setSavedAt(false)
                  }}
                  className={cn(
                    'h-9 rounded-full border px-3.5 text-[13px] font-medium transition active:scale-95',
                    percent === q ? 'border-white bg-white text-black' : 'border-white/5 bg-zinc-900/40 text-zinc-400 hover:border-white/15 hover:text-white'
                  )}
                >
                  {q}%
                </button>
              ))}
            </div>
          </div>
          {!valid && (
            <p role="alert" className="mt-2 text-xs text-red-300">
              Введите целое число от {PROMO_MIN} до {PROMO_MAX}
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-5 flex items-start gap-2 rounded-2xl bg-red-950/50 px-3 py-2.5 text-sm text-red-300">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </p>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={!dirty || !valid || saving}
            className="flex h-12 min-w-40 items-center justify-center gap-2 rounded-2xl bg-brand px-6 text-[15px] font-semibold text-brand-contrast shadow-[inset_0_1px_0_rgb(255_255_255/0.28)] transition hover:brightness-110 active:scale-[0.98] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none disabled:hover:brightness-100"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Сохранить'}
          </button>
          {savedAt && !dirty && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-400">
              <Check className="h-4 w-4" /> {promo.enabled ? `Скидка −${promo.percent}% действует на сайте` : 'Скидка выключена'}
            </span>
          )}
        </div>
      </div>

      {/* Предпросмотр */}
      <div className="glass rounded-3xl p-5 lg:col-span-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Так увидит клиент</h3>
        {example ? (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
            <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-white">{example.name}</span>
            {enabled && valid ? (
              <span className="inline-flex shrink-0 flex-col items-end gap-0.5">
                <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <span className="rounded-full bg-brand px-1.5 py-px text-[10px] font-semibold leading-4 text-brand-contrast">−{percent}%</span>
                  <s className="decoration-zinc-500/80">от {formatPrice(example.price)}</s>
                </span>
                <span className="text-[15px] font-semibold tabular-nums text-white">от {formatPrice(applyDiscount(example.price, percent))}</span>
              </span>
            ) : (
              <span className="shrink-0 text-[15px] font-semibold tabular-nums text-white">от {formatPrice(example.price)}</span>
            )}
          </div>
        ) : null}
        <p className="mt-3 text-xs leading-relaxed text-zinc-500">
          Цена со скидкой округляется до 10 ₽. В Telegram мастеру приходит и цена со скидкой, и обычная — чтобы он назвал клиенту ту же сумму, что видна на сайте.
        </p>
        <p className="mt-4 text-sm text-zinc-400">
          Сейчас на сайте:{' '}
          <span className={cn('font-semibold', promo.active ? 'text-emerald-400' : 'text-zinc-300')}>
            {promo.active ? `скидка −${promo.percent}%` : 'без скидки'}
          </span>
        </p>
      </div>
    </section>
  )
}
