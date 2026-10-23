import { ArrowUpRight, Clock, MapPin, Phone } from 'lucide-react'

import business from '../business.json'
import { cn } from '../lib/cn'
import { socials } from '../lib/contacts'
import { telHref } from '../lib/format'
import { arrowShift, arrowShiftSm, btnGlassSm, btnNeon } from '../lib/ui'

type Props = {
  onBook: () => void
}

/** Виджет «Оставить заявку»: на десктопе живёт в правой колонке (липкость — у обёртки в ClientView), на телефоне стоит в конце страницы */
export default function BookingWidget({ onBook }: Props) {
  return (
    <section
      id="booking"
      aria-labelledby="booking-title"
      className="glass flex min-w-0 scroll-mt-4 flex-col gap-4 rounded-3xl p-5"
    >
      <div>
        <h2 id="booking-title" className="text-xl font-semibold tracking-tight text-white">
          Оставить заявку
        </h2>
        <p className="mt-1 text-sm text-zinc-500">Выберите услугу и оставьте контакты — мастер свяжется с вами сам.</p>
      </div>

      <button type="button" onClick={onBook} className={cn(btnNeon, 'h-14 w-full')}>
        Оставить заявку
        <ArrowUpRight className={arrowShift} />
      </button>

      {/* Контакты: все строки с одинаковым ритмом py-3, текст выровнен по левому краю p-5 */}
      <div className="border-t border-white/5">
        <ul className="divide-y divide-white/5 text-sm text-zinc-300">
          <li className="flex items-center gap-3 py-3">
            <Clock className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={1.75} />
            <span className="min-w-0">
              Ежедневно с {business.workingHours.open} до {business.workingHours.close}
            </span>
          </li>
          <li className="flex items-start gap-3 py-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" strokeWidth={1.75} />
            <a
              href={business.addressUrl}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 break-words underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              {business.address}
            </a>
          </li>
          <li>
            <a href={telHref(business.phone)} className="flex items-center gap-3 py-3 font-medium text-white">
              <Phone className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={1.75} />
              <span className="min-w-0 truncate">{business.phone}</span>
            </a>
          </li>
        </ul>

        {/* Ровно по 50%: grid-cols-2 = два столбца minmax(0,1fr). Нечётная последняя кнопка растягивается на всю ширину */}
        <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-4">
          {socials.map(({ id, label, href, icon: Icon, onClick }, i) => (
            <a
              key={id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClick}
              className={cn(
                btnGlassSm,
                'h-12 min-w-0 whitespace-nowrap',
                socials.length % 2 === 1 && i === socials.length - 1 && 'col-span-2'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} /> {label}
              <ArrowUpRight className={cn(arrowShiftSm, 'hidden shrink-0 min-[360px]:block')} />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
