import { useState } from 'react'

import BookingSheet from '../components/BookingSheet'
import BookingWidget from '../components/BookingWidget'
import FloatingContact from '../components/FloatingContact'
import Hero from '../components/Hero'
import PillNav from '../components/PillNav'
import PortfolioGallery from '../components/PortfolioGallery'
import SocialLinks from '../components/SocialLinks'
import ServiceTable from '../components/ServiceTable'
import StatsRow from '../components/StatsRow'
import Trust from '../components/Trust'
import { useMediaQuery } from '../lib/useMediaQuery'

type SheetState = { open: boolean; key: number; serviceId?: string }

export default function ClientView() {
  const [sheet, setSheet] = useState<SheetState>({ open: false, key: 0 })
  // Один экземпляр «Наших работ»: на десктопе — под заявкой, на телефоне — между услугами и заявкой
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  /* ---- Открытие шторки заявки ---- */
  const openBooking = (preset?: { serviceId?: string }) =>
    setSheet((s) =>
      preset?.serviceId
        ? { open: true, key: s.key + 1, serviceId: preset.serviceId } // строка прайса → форма с нуля, услуга выбрана
        : { ...s, open: true } // общая кнопка → продолжаем с того места, где остановился клиент
    )
  const closeSheet = (done: boolean) => {
    if (done) setSheet((s) => ({ open: false, key: s.key + 1 })) // заявка отправлена → форма сбрасывается
    else setSheet((s) => ({ ...s, open: false }))
  }

  /* ---------- Разметка ---------- */
  return (
    <div className="min-h-dvh bg-black">
      {/*
        Bento-сетка: на десктопе 12 колонок, на телефоне одна.
        Hero, статистика и блок доверия — на всю ширину; ниже услуги (8) и липкий виджет заявки (4).
      */}
      <div className="mx-auto w-full max-w-7xl px-4 pb-32 pt-4 lg:pb-10">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div id="home" className="lg:col-span-12">
            <Hero onBook={() => openBooking()} />
          </div>

          <div className="lg:col-span-12">
            <StatsRow />
          </div>

          <div className="lg:col-span-12">
            <Trust />
          </div>

          <main className="flex min-w-0 flex-col gap-8 lg:col-span-8">
            <ServiceTable onBook={(serviceId) => openBooking({ serviceId })} />

            {/* Телефон / планшет: услуги → работы → заявка. Видишь цены, затем результат, затем кнопка */}
            {!isDesktop && <PortfolioGallery />}
          </main>

          {/* Правая колонка: заявка; обёртка залипает при скролле (если помещается по высоте) */}
          <aside className="lg:col-span-4">
            <div className="aside-sticky flex flex-col gap-4">
              <BookingWidget onBook={() => openBooking()} />
              {/* Десктоп: работы сразу под блоком «Оставить заявку» */}
              {isDesktop && <PortfolioGallery className="pt-3" />}
            </div>
          </aside>

          <footer className="flex flex-col items-center gap-4 pt-4 text-center lg:col-span-12">
            <SocialLinks />
            <a href="#admin" className="text-xs text-zinc-600 underline-offset-4 hover:underline">
              Вход для владельца
            </a>
          </footer>
        </div>
      </div>

      {/* Плавающие элементы: таблетка навигации (только телефон) и кнопка связи */}
      <PillNav bookingOpen={sheet.open} onBooking={() => openBooking()} />
      <FloatingContact hidden={sheet.open} />

      <BookingSheet key={sheet.key} open={sheet.open} onClose={closeSheet} initialServiceId={sheet.serviceId} />
    </div>
  )
}
