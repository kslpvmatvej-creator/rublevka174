import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '../lib/cn'
import CarPhoto from './CarPhoto'

/**
 * «Наши работы» — горизонтальная лента одинаковых вертикальных карточек (4:5).
 *
 * КАК ПОДСТАВИТЬ НАСТОЯЩИЕ ФОТО (быстрые, локальные, без внешних ссылок):
 *  1. Положите оригиналы в папку `works-src/` (в корне проекта).
 *  2. Выполните `node scripts/optimize-works.mjs` — в `public/works/` появятся лёгкие WebP двух размеров
 *     (`<имя>-400.webp` и `<имя>-800.webp`), скрипт напечатает готовые имена.
 *  3. Впишите имя (без размера и расширения) в поле `file` нужной карточки ниже.
 * Пока `file` не задан — показывается графитовая заглушка с иконкой авто.
 */
type Work = {
  id: string
  /** Что сделали: короткий заголовок на карточке */
  title: string
  /** Автомобиль или деталь: вторая строка (необязательно) */
  caption?: string
  /** Имя файла из public/works без суффикса размера и расширения, например 'polish-1' */
  file?: string
}

const WORKS: Work[] = [
  { id: 'w1', title: 'Оклейка плёнкой', caption: 'Mercedes-Benz', file: 'wrap-mercedes' },
  { id: 'w2', title: 'Полировка кузова', caption: 'Mercedes-Benz', file: 'polish-mercedes-s-detail' },
  { id: 'w3', title: 'Полировка кузова', caption: 'Mercedes-Benz', file: 'polish-mercedes-s' },
  { id: 'w4', title: 'Реставрация кожи', caption: 'Bentley · до', file: 'leather-bentley-before' },
  { id: 'w5', title: 'Реставрация кожи', caption: 'Bentley · после', file: 'leather-bentley-after' },
  { id: 'w6', title: 'Оклейка плёнкой', caption: 'Porsche', file: 'wrap-porsche' },
  { id: 'w7', title: 'Химчистка салона', caption: 'Porsche · до', file: 'interior-panamera-before' },
  { id: 'w8', title: 'Химчистка салона', caption: 'Porsche · после', file: 'interior-panamera-after' },
  { id: 'w9', title: 'Полировка кузова', caption: 'BMW', file: 'polish-bmw' },
  { id: 'w10', title: 'Мойка двигателя', caption: 'Volkswagen', file: 'engine-vw' },
  { id: 'w11', title: 'Реставрация кожи', caption: 'Mercedes-Benz', file: 'leather-mercedes-wheel' },
  { id: 'w12', title: 'Полировка кузова', caption: 'Toyota', file: 'polish-toyota-1' },
  { id: 'w13', title: 'Полировка кузова', caption: 'Toyota', file: 'polish-toyota-2' },
  { id: 'w14', title: 'Реставрация кожи', caption: 'Porsche Panamera', file: 'leather-panamera-wheel' },
]

/** Ширины, которые делает scripts/optimize-works.mjs. Карточка ≤ 192 px: 400w хватает на ×2, 800w — на ×3–4 */
const SRC_SMALL = 400
const SRC_LARGE = 800
const url = (file: string, w: number) => `/works/${file}-${w}.webp`

type Props = { className?: string }

export default function PortfolioGallery({ className }: Props) {
  const rowRef = useRef<HTMLUListElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const frame = useRef(0)
  const [edge, setEdge] = useState({ start: true, end: false })

  /** Стрелки (десктоп) гаснут у краёв ленты; полоска прогресса показывает, сколько ещё можно листать */
  const update = useCallback(() => {
    const el = rowRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    const start = el.scrollLeft <= 4
    const end = el.scrollLeft >= max - 4
    setEdge((p) => (p.start === start && p.end === end ? p : { start, end }))

    const track = trackRef.current
    const thumb = thumbRef.current
    if (track && thumb) {
      track.style.opacity = max > 4 ? '1' : '0'
      const ratio = el.clientWidth / el.scrollWidth
      const progress = max > 0 ? Math.min(1, Math.max(0, el.scrollLeft / max)) : 0
      thumb.style.width = `${ratio * 100}%`
      thumb.style.transform = `translateX(${progress * (1 / ratio - 1) * 100}%)`
    }
  }, [])

  /** onScroll срабатывает очень часто — обновляем не чаще одного раза за кадр */
  const onScroll = useCallback(() => {
    if (frame.current) return
    frame.current = requestAnimationFrame(() => {
      frame.current = 0
      update()
    })
  }, [update])

  useEffect(() => {
    const el = rowRef.current
    if (!el) return
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)

    // Карточка, целиком попавшая в кадр, «включается» (data-on=1); та, что выглядывает с краю, чуть приглушена
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) (e.target as HTMLElement).dataset.on = e.intersectionRatio >= 0.7 ? '1' : '0'
      },
      { root: el, threshold: [0, 0.35, 0.7, 1] }
    )
    el.querySelectorAll('li').forEach((li) => io.observe(li))

    return () => {
      ro.disconnect()
      io.disconnect()
      cancelAnimationFrame(frame.current)
      frame.current = 0
    }
  }, [update])

  const page = (dir: 1 | -1) => {
    const el = rowRef.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' })
  }

  if (WORKS.length === 0) return null

  const arrow =
    'glass-dark flex h-9 w-9 items-center justify-center rounded-full text-zinc-200 transition hover:text-white active:scale-95 disabled:pointer-events-none disabled:opacity-30'

  return (
    <section id="works" aria-labelledby="works-title" className={cn('min-w-0 scroll-mt-4', className)}>
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <h2 id="works-title" className="text-xl font-semibold text-white">
          Наши работы
        </h2>
        <div className="hidden gap-2 lg:flex">
          <button type="button" onClick={() => page(-1)} disabled={edge.start} aria-label="Назад" className={arrow}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => page(1)} disabled={edge.end} aria-label="Вперёд" className={arrow}>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/*
        Лента. На телефоне выходит за поля страницы (-mx-4 px-4): карточки «вытекают» к краю экрана,
        а следующая видна наполовину — это подсказка, что можно свайпать.

        Почему раньше свайп «то работал, то нет»:
         — snap-mandatory возвращал ленту назад на короткий или медленный свайп → теперь snap-proximity:
           лента едет за пальцем свободно и мягко «примагничивается» к карточке;
         — подпись лежала на backdrop-blur-плашке и перехватывала касание → теперь у неё нет размытия
           и pointer-events-none, а на всей ленте select-none (выделение текста не мешает жесту).
        overscroll-x-contain — свайп по ленте не запускает жест «назад» в браузере.
        py-3 / -my-3 дают место свечению карточки при наведении, не меняя внешние отступы.
      */}
      <ul
        ref={rowRef}
        onScroll={onScroll}
        className="-mx-4 -my-3 flex snap-x snap-proximity scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 py-3 select-none [-webkit-touch-callout:none] [scrollbar-width:none] lg:-mx-2 lg:scroll-px-2 lg:px-2 [&::-webkit-scrollbar]:hidden"
      >
        {WORKS.map((w) => (
          <li
            key={w.id}
            className="w-[46vw] max-w-52 min-w-40 shrink-0 snap-start transition-[scale,opacity] duration-500 ease-out data-[on=0]:scale-[0.95] data-[on=0]:opacity-60 motion-reduce:transition-none sm:w-48 lg:w-44"
          >
            <figure className="hover-lift group relative isolate aspect-[4/5] overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40">
              <CarPhoto
                key={w.file ?? w.id}
                src={w.file ? url(w.file, SRC_SMALL) : undefined}
                srcSet={w.file ? `${url(w.file, SRC_SMALL)} ${SRC_SMALL}w, ${url(w.file, SRC_LARGE)} ${SRC_LARGE}w` : undefined}
                sizes="(min-width: 1024px) 176px, (min-width: 640px) 192px, 46vw"
                alt={[w.title, w.caption].filter(Boolean).join(' — ')}
                className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
              {/* Затемнение снизу под подпись и сама подпись: без backdrop-blur и без перехвата касаний */}
              <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
              <figcaption className="pointer-events-none absolute inset-x-2 bottom-2 rounded-2xl border border-white/10 bg-black/55 px-3 py-2">
                <span className="block truncate text-sm font-medium leading-tight text-white">{w.title}</span>
                {w.caption && <span className="mt-0.5 block truncate text-xs leading-tight text-zinc-400">{w.caption}</span>}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      {/* Полоска прогресса: показывает, что ленту можно листать, и где вы сейчас */}
      <div
        ref={trackRef}
        aria-hidden
        className="mx-1 mt-5 h-[3px] overflow-hidden rounded-full bg-white/10 opacity-0 transition-opacity duration-300"
      >
        <div ref={thumbRef} className="h-full w-1/3 rounded-full bg-white/70 will-change-transform" />
      </div>
    </section>
  )
}
