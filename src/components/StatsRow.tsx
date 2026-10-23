import business from '../business.json'
import { SERVICES } from '../lib/catalog'
import { formatPrice } from '../lib/format'
import { applyDiscount, usePromo } from '../lib/promo'
import { plural } from '../lib/plural'

/** Плашка: на телефоне значение над подписью (мелкий шрифт), с md — в одну строку. Длинное значение обрезается. */
function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div className="glass flex min-w-0 flex-col justify-center gap-1 overflow-hidden rounded-3xl px-2 py-4 min-[400px]:px-3 md:flex-row md:items-baseline md:gap-3 md:px-6 md:py-5">
      {/* Три равные плашки. Размер шрифта плавно следует ширине экрана (clamp), чтобы «11:00–20:00» влезало целиком
          даже на 320 px, а плашки оставались одинаковыми. whitespace-nowrap вместо truncate: без многоточия. */}
      <p
        title={value}
        className="min-w-0 whitespace-nowrap text-[clamp(11px,3.5vw,15px)] font-semibold leading-none tracking-tight text-white tabular-nums md:shrink-0 md:text-3xl"
      >
        {value}
      </p>
      <p className="min-w-0 truncate text-xs text-zinc-500 md:text-sm">{label}</p>
    </div>
  )
}

/** Три горизонтальные плашки: услуги, часы работы, минимальная цена */
export default function StatsRow() {
  const promo = usePromo()
  const s = SERVICES.length
  // Услуги без числовой цены («Индивидуальный расчёт», «После осмотра») в минимум не входят
  const from = Math.min(...SERVICES.map((x) => x.price).filter((p) => p > 0))

  return (
    <div className="grid grid-cols-3 gap-2 min-[400px]:gap-3 md:gap-4">
      <Tile value={String(s)} label={plural(s, 'услуга', 'услуги', 'услуг')} />
      <Tile value={`${business.workingHours.open}–${business.workingHours.close}`} label="ежедневно" />
      {/* «от» вынесено в подпись, чтобы число влезало в узкую плашку (iPhone SE) */}
      <Tile value={formatPrice(promo.active ? applyDiscount(from, promo.percent) : from)} label={promo.active ? `цена от · −${promo.percent}%` : 'цена от'} />
    </div>
  )
}
