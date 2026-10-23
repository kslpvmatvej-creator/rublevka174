import { useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowUpRight, Car, Pencil, Phone, User } from 'lucide-react'

import business from '../business.json'
import Sheet from './Sheet'
import PriceTag from './PriceTag'
import SuccessView, { type LeadSummary } from './SuccessView'
import { SERVICES, resolveIcon, servicePriceLabel } from '../lib/catalog'
import { cn } from '../lib/cn'
import { formatPhone, formatPrice } from '../lib/format'
import { applyDiscount, usePromo } from '../lib/promo'
import { submitLead } from '../lib/sendLead'
import { arrowShift, btnGlass } from '../lib/ui'

/** Варианты вопроса «Откуда вы о нас узнали?» — редактируются в business.json → leadSources */
const SOURCES = (business.leadSources ?? []) as string[]

const INPUT =
  'w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 text-base text-zinc-50 outline-none transition placeholder:text-zinc-600 focus:border-brand focus:ring-2 focus:ring-brand/30'

/** Основная кнопка шторки — те же стили, что были у «Записаться» */
const BTN_PRIMARY =
  'flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand text-base font-semibold text-brand-contrast shadow-[inset_0_1px_0_rgb(255_255_255/0.28)] transition hover:brightness-110 active:scale-[0.98] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none disabled:hover:brightness-100'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="pt-6">
      <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">{label}</h3>
      {children}
    </section>
  )
}

type Props = {
  open: boolean
  /** done = true, если заявка отправлена: родитель сбрасывает форму */
  onClose: (done: boolean) => void
  /** Предвыбор при открытии из строки прайса: сразу попадаем на шаг 2 */
  initialServiceId?: string
}

/**
 * Шторка заявки — два шага:
 *  1) выбор услуги;
 *  2) контакты: имя, телефон, марка и модель авто → «Отправить заявку».
 * Ни даты, ни времени, ни занятости боксов: это сбор «горячих» лидов, мастер перезванивает сам.
 * Мобильный — bottom sheet, десктоп — окно по центру (см. Sheet).
 */
export default function BookingSheet({ open, onClose, initialServiceId }: Props) {
  const [serviceId, setServiceId] = useState<string | null>(() =>
    SERVICES.some((s) => s.id === initialServiceId) ? (initialServiceId as string) : null
  )
  const [step, setStep] = useState<1 | 2>(() => (SERVICES.some((s) => s.id === initialServiceId) ? 2 : 1))
  const promo = usePromo()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [car, setCar] = useState('')
  const [comment, setComment] = useState('')
  const [source, setSource] = useState<string | null>(null)
  const [success, setSuccess] = useState<LeadSummary | null>(null)

  const service = SERVICES.find((s) => s.id === serviceId) ?? null
  const phoneDigits = phone.replace(/\D/g, '')

  const missing =
    name.trim().length < 2
      ? 'Введите имя'
      : phoneDigits.length !== 11
        ? 'Введите телефон'
        : car.trim().length < 2
          ? 'Укажите марку и модель авто'
          : SOURCES.length > 0 && !source
            ? 'Выберите, откуда вы о нас узнали'
            : null

  const submit = () => {
    if (!service || missing) return

    const lead = { name: name.trim(), phone: `+${phoneDigits}`, vehicle: car.trim() }
    // Что видел клиент: при акции — новая цена и размер скидки, чтобы мастер назвал ту же сумму
    const priceText =
      promo.active && !service.priceLabel && service.price > 0
        ? `от ${formatPrice(applyDiscount(service.price, promo.percent))} (скидка ${promo.percent}%, без скидки ${servicePriceLabel(service)})`
        : servicePriceLabel(service)
    const note = comment.trim()

    // Мгновенный ответ клиенту: доставка (Supabase + Telegram) идёт в фоне, при сбое заявка
    // остаётся в очереди и дошлётся сама (см. lib/sendLead.ts)
    submitLead({ service: service.name, priceText, ...lead, source, ...(note ? { comment: note } : {}) })
    setSuccess({ serviceName: service.name, vehicle: lead.vehicle, phone })
  }

  /* ---------- Разметка ---------- */
  return (
    <Sheet
      open={open}
      onClose={() => onClose(!!success)}
      title={success ? 'Готово' : 'Оставить заявку'}
      description={success ? undefined : step === 1 ? 'Шаг 1 из 2 · Выберите услугу' : 'Шаг 2 из 2 · Ваши контакты'}
      footer={
        success ? (
          <button
            type="button"
            onClick={() => onClose(true)}
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-zinc-100 text-base font-semibold text-zinc-900 transition active:scale-[0.98]"
          >
            Закрыть
          </button>
        ) : step === 1 ? (
          <div>
            <p className="mb-2.5 truncate text-sm text-zinc-400">
              {service ? <span className="text-zinc-100">{service.name}</span> : 'Выберите услугу'}
            </p>
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!service}
              className={cn(BTN_PRIMARY, 'w-full')}
            >
              Продолжить
              <ArrowUpRight className={arrowShift} />
            </button>
          </div>
        ) : (
          <div>
            {missing && <p className="mb-2.5 text-sm text-zinc-500">{missing}</p>}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setStep(1)}
                aria-label="Назад к выбору услуги"
                className={cn(btnGlass, 'h-14 w-14 shrink-0')}
              >
                <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!!missing}
                className={cn(BTN_PRIMARY, 'min-w-0 flex-1')}
              >
                Отправить заявку
              </button>
            </div>
          </div>
        )
      }
    >
      {success ? (
        <SuccessView summary={success} />
      ) : step === 1 ? (
        /* ---------- Шаг 1: услуга ---------- */
        <Field label="Услуга">
          <div role="radiogroup" aria-label="Услуга" className="space-y-2">
            {SERVICES.map((s) => {
              const active = service?.id === s.id
              const Icon = resolveIcon(s.icon)
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setServiceId(s.id)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition active:scale-[0.99]',
                    active ? 'border-brand bg-brand-soft shadow-glow' : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                  )}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-brand-fg ring-1 ring-white/10">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold leading-snug text-zinc-50">{s.name}</span>
                    {s.description && (
                      <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-zinc-400">{s.description}</span>
                    )}
                  </span>
                  <span className="max-w-[7.5rem] shrink-0 text-right">
                    <PriceTag service={s} className="text-[15px] font-semibold leading-tight tabular-nums text-white" />
                  </span>
                </button>
              )
            })}
          </div>
        </Field>
      ) : (
        /* ---------- Шаг 2: контакты ---------- */
        <>
          {service && (
            <Field label="Выбранная услуга">
              <div className="glass flex items-center gap-3 rounded-2xl p-3.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-zinc-50">{service.name}</span>
                  <span className="mt-0.5 block text-xs tabular-nums text-zinc-500">
                    <PriceTag service={service} align="left" className="text-xs tabular-nums text-zinc-400" />
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white active:scale-95"
                >
                  <Pencil className="h-3.5 w-3.5" /> Изменить
                </button>
              </div>
            </Field>
          )}

          <Field label="Контакты">
            <div className="space-y-2.5">
              <div className="relative">
                <User aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Имя"
                  autoComplete="name"
                  aria-label="Имя"
                  className={cn(INPUT, 'h-12 pl-10')}
                />
              </div>
              <div className="relative">
                <Phone aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="Телефон"
                  autoComplete="tel"
                  aria-label="Телефон"
                  className={cn(INPUT, 'h-12 pl-10')}
                />
              </div>
              <div className="relative">
                <Car aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={car}
                  onChange={(e) => setCar(e.target.value)}
                  placeholder="Марка и модель авто"
                  autoComplete="off"
                  aria-label="Марка и модель авто"
                  className={cn(INPUT, 'h-12 pl-10')}
                />
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Комментарий (необязательно)"
                aria-label="Комментарий"
                rows={3}
                maxLength={300}
                className={cn(INPUT, 'resize-none py-3')}
              />
            </div>
          </Field>

          {SOURCES.length > 0 && (
            <Field label="Откуда вы о нас узнали?">
              <div role="radiogroup" aria-label="Откуда вы о нас узнали" className="flex flex-wrap gap-2">
                {SOURCES.map((src) => {
                  const active = source === src
                  return (
                    <button
                      key={src}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSource(src)}
                      className={cn(
                        'h-10 rounded-full border px-4 text-sm font-medium transition active:scale-95',
                        active
                          ? 'border-brand bg-brand-soft text-white shadow-glow'
                          : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:text-white'
                      )}
                    >
                      {src}
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                Предоплата не нужна. Точную стоимость мастер назовёт после уточнения деталей.
              </p>
            </Field>
          )}
        </>
      )}
    </Sheet>
  )
}
