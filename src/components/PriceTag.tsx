import { servicePriceLabel, type Service } from '../lib/catalog'
import { cn } from '../lib/cn'
import { formatPrice } from '../lib/format'
import { applyDiscount, usePromo } from '../lib/promo'

type Props = {
  service: Pick<Service, 'price' | 'priceLabel'>
  /** Класс для основной цены (размер/цвет задаёт место использования) */
  className?: string
  align?: 'right' | 'left'
}

/**
 * Цена услуги. При включённой глобальной скидке старая цена перечёркивается,
 * рядом — бейдж «−10%», ниже — новая. Текстовые цены («После осмотра») скидкой не затрагиваются.
 */
export default function PriceTag({ service, className, align = 'right' }: Props) {
  const { active, percent } = usePromo()
  const label = servicePriceLabel(service)

  if (!active || service.priceLabel || service.price <= 0) return <span className={className}>{label}</span>

  return (
    <span className={cn('inline-flex flex-col gap-0.5', align === 'right' ? 'items-end' : 'items-start')}>
      <span className="flex items-center gap-1.5 text-xs font-normal text-zinc-500">
        <span className="rounded-full bg-brand px-1.5 py-px text-[10px] font-semibold leading-4 text-brand-contrast no-underline">
          −{percent}%
        </span>
        <s className="decoration-zinc-500/80">{label}</s>
      </span>
      <span className={className}>от {formatPrice(applyDiscount(service.price, percent))}</span>
    </span>
  )
}
