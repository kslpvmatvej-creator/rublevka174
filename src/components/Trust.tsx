import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, Award, Star, X } from 'lucide-react'

import business from '../business.json'
import { withBase } from '../lib/asset'
import { cn } from '../lib/cn'
import { plural } from '../lib/plural'

type AwardsConfig = { photo?: string; eyebrow?: string; title?: string; caption?: string }
type ReviewsConfig = { rating?: number; count?: number; url?: string }
const awards = (business as { awards?: AwardsConfig }).awards
const reviews = (business as { reviews?: ReviewsConfig }).reviews

/** Ряд звёзд: заполненные — золотые, остальные — тусклые контуры */
function Stars({ value, className }: { value: number; className: string }) {
  const filled = Math.round(value)
  return (
    <span className="flex gap-1" role="img" aria-label={`Рейтинг ${value} из 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden
          strokeWidth={1.5}
          className={cn(
            className,
            i < filled ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgb(251_191_36/0.35)]' : 'text-zinc-700'
          )}
        />
      ))}
    </span>
  )
}

/** Полноэкранный просмотр вертикального фото: целиком, без обрезки, закрывается тапом, крестиком и Esc */
function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      className="animate-fade-in fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-md"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Закрыть"
        className="glass-dark absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center rounded-full text-zinc-200 transition hover:text-white active:scale-95"
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={withBase(src)}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[calc(100dvh-2rem)] max-w-full rounded-3xl border border-white/10 object-contain shadow-[0_30px_100px_-20px_rgba(0,0,0,0.9)]"
      />
    </div>,
    document.body
  )
}

/**
 * Единый блок доверия: сверху награда 2ГИС (превью фото → по тапу целиком), снизу рейтинг и ссылка на отзывы.
 * Данные: business.json → awards (photo, eyebrow, title, caption) и reviews (rating, count, url).
 * Нет фото — верхняя часть скрыта, нет рейтинга — скрыта нижняя; нет обоих — блока нет.
 */
export default function Trust() {
  const [open, setOpen] = useState(false)
  const [photoFailed, setPhotoFailed] = useState(false)

  const showAward = Boolean(awards?.photo) && !photoFailed
  const showReviews = Boolean(reviews?.rating && reviews.count)
  if (!showAward && !showReviews) return null

  const title = awards?.title ?? 'Премия 2ГИС'

  const reviewsBody = showReviews && reviews && (
    <>
      <span className="metal-text text-5xl font-semibold leading-none tracking-tight tabular-nums">
        {reviews.rating!.toFixed(1)}
      </span>
      <span className="min-w-0 flex-1">
        <Stars value={reviews.rating!} className="h-5 w-5" />
        <span className="mt-1.5 block text-sm leading-snug text-zinc-400">
          На основе {reviews.count} {plural(reviews.count!, 'реального отзыва', 'реальных отзыва', 'реальных отзывов')}
        </span>
      </span>
    </>
  )

  return (
    <section id="awards" aria-label="Нам доверяют" className="glass relative overflow-hidden rounded-3xl">
      {/* Мягкие свечения: брендовое у награды, золотое у рейтинга */}
      <div aria-hidden className="pointer-events-none absolute -left-10 -top-16 h-48 w-48 rounded-full bg-brand/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 -right-10 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" />

      {/* Награда */}
      {showAward && awards?.photo && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-label={`${title}: открыть фото`}
          className="group relative flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-white/[0.03] md:gap-6 md:p-5"
        >
          <span className="relative h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 ring-1 ring-brand/30 md:h-28 md:w-[5.25rem]">
            <img
              src={withBase(awards.photo)}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setPhotoFailed(true)}
              className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            />
          </span>

          <span className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-amber-300">
              <Award className="h-3 w-3" strokeWidth={2} />
              {awards.eyebrow ?? 'Награда'}
            </span>
            <span className="mt-2 block text-xl font-semibold leading-tight tracking-tight text-white md:text-2xl">{title}</span>
            {awards.caption && <span className="mt-1 block text-sm leading-snug text-zinc-300">{awards.caption}</span>}
            <span className="mt-1.5 block text-xs text-zinc-500">Нажмите, чтобы посмотреть фото</span>
          </span>
        </button>
      )}

      {/* Разделитель */}
      {showAward && showReviews && <div aria-hidden className="mx-4 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent md:mx-5" />}

      {/* Отзывы: вся нижняя часть — ссылка в 2ГИС */}
      {showReviews &&
        (reviews?.url ? (
          <a
            href={reviews.url}
            target="_blank"
            rel="noreferrer"
            className="group relative block p-4 transition-colors hover:bg-white/[0.03] md:p-5"
          >
            <span className="flex items-center gap-4">{reviewsBody}</span>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-white">
              Читать отзывы в 2ГИС
              <ArrowUpRight className="h-4 w-4 text-zinc-400 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </a>
        ) : (
          <div className="relative flex items-center gap-4 p-4 md:p-5">{reviewsBody}</div>
        ))}

      {open && awards?.photo && <Lightbox src={awards.photo} alt={title} onClose={() => setOpen(false)} />}
    </section>
  )
}
