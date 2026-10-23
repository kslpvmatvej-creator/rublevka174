import { ArrowUpRight, Phone } from 'lucide-react'

import business from '../business.json'
import { cn } from '../lib/cn'
import { telHref } from '../lib/format'
import { arrowShift, btnBase } from '../lib/ui'
import CarPhoto from './CarPhoto'
import SocialLinks from './SocialLinks'

type Props = {
  onBook: () => void
}

/**
 * Кинематографичный баннер: фото, затемнение, зерно, зеркальная кнопка «Оставить заявку ↗».
 * Фон — вертикальный кадр (public/hero/fon-*.webp, исходник hero-src/fon.jpg):
 *  — телефон: баннер 400 px, небо обрезано (object-position 90%), машина по центру, текст снизу;
 *  — от md: фото справа (58% ширины), левый край плавно растворяется в чёрном, текст и кнопка слева.
 * Если кадр поменяется — подберите object-position (сейчас 50% 58%) в imgClassName ниже.
 */
export default function Hero({ onBook }: Props) {
  return (
    <header className="relative isolate flex h-[400px] flex-col justify-between overflow-hidden rounded-3xl border border-white/5 bg-black md:h-[420px]">
      <div
        aria-hidden
        className="absolute inset-0 -z-30 md:left-auto md:w-[58%] md:[mask-image:linear-gradient(to_right,transparent,#000_30%)]"
      >
        <CarPhoto
          src={business.hero.photo}
          srcSet={business.hero.photoSrcSet}
          sizes="(min-width: 768px) 58vw, 100vw"
          alt={business.hero.photoAlt}
          imgClassName="object-[50%_90%] md:object-[50%_58%]"
          priority
        />
      </div>
      {/* Кино-затемнение: общий приглушающий слой, затем градиент и радиальная тень к низу */}
      <div aria-hidden className="absolute inset-0 -z-20 bg-black/10" />
      <div aria-hidden className="absolute inset-0 -z-20 bg-gradient-to-t from-black via-black/35 to-transparent" />
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[radial-gradient(120%_70%_at_50%_100%,rgb(0_0_0/0.85),transparent_70%)]"
      />
      <div aria-hidden className="grain absolute inset-0 -z-10" />

      {/* Верхняя панель */}
      <div className="flex items-center justify-between p-4 md:p-6">
        <div className="glass-dark flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-[13px] font-medium text-white">
            {business.shortName.charAt(0)}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-zinc-200">{business.shortName}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Соцсети в шапке — только на широких экранах; на телефоне их заменяет плавающая кнопка связи */}
          <SocialLinks className="hidden md:flex" />
          <a
            href={telHref(business.phone)}
            aria-label={`Позвонить: ${business.phone}`}
            className="glass-dark flex h-10 items-center gap-2 rounded-full px-3 text-sm text-zinc-200 transition hover:border-white/20 hover:text-white active:scale-95 md:px-4"
          >
            <Phone className="h-4 w-4" strokeWidth={1.75} />
            <span className="hidden md:inline">{business.phone}</span>
          </a>
        </div>
      </div>

      {/* Заголовок и кнопка: на телефоне внизу, на широких экранах — слева колонкой */}
      <div className="animate-rise flex flex-col gap-4 p-4 md:max-w-[46%] md:p-8">
        <div className="min-w-0">
          <h1 className="text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-white min-[400px]:text-3xl md:text-4xl lg:text-5xl">{business.name}</h1>
          <p className="mt-2 max-w-[40ch] text-sm leading-relaxed text-zinc-400 md:text-base">{business.tagline}</p>
        </div>

        <button
          type="button"
          onClick={onBook}
          className={cn(btnBase, 'mirror h-12 shrink-0 px-7 text-[15px] font-medium text-white md:h-14 md:self-start')}
        >
          Оставить заявку
          <ArrowUpRight className={arrowShift} />
        </button>
      </div>
    </header>
  )
}
