import type { MouseEvent } from 'react'
import { Instagram, MapPinned, MessageCircle, Send, type LucideIcon } from 'lucide-react'

import business from '../business.json'

/**
 * Соцсети и мессенджеры. ВСЕ ссылки меняются в одном месте — src/business.json → contacts:
 *   telegram  — ник без @ или полная ссылка            "rublevka174"
 *   whatsapp  — номер цифрами (7…) или полная ссылка   "79517708880"
 *   instagram — ник без @ или полная ссылка            "rublevka174"   (пусто → кнопка скрыта)
 *   twoGis    — полная ссылка на карточку в 2ГИС       (пусто → кнопка скрыта)
 */
type Contacts = { telegram?: string; whatsapp?: string; instagram?: string; twoGis?: string }
const c = business.contacts as Contacts

const isUrl = (v: string) => /^https?:\/\//i.test(v)
const handle = (v: string) => v.trim().replace(/^@/, '').replace(/^\/+|\/+$/g, '')

/** Цифры номера в международном виде: 8 951… и 951… → 7951… */
const waDigits = (v: string) => {
  let d = v.replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('8')) d = '7' + d.slice(1)
  if (d.length === 10) d = '7' + d
  return d
}

export type Social = {
  id: 'telegram' | 'whatsapp' | 'instagram' | '2gis'
  label: string
  href: string
  icon: LucideIcon
  /** Необязательный перехват клика (нужен WhatsApp на компьютере) */
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
}

/**
 * WhatsApp на компьютере.
 * Обычная ссылка wa.me на ПК перекидывает на api.whatsapp.com / web.whatsapp.com — если эти адреса у человека
 * не открываются (блокировки, нет WhatsApp Web), кнопка выглядит «мёртвой». Поэтому на ПК сначала пробуем открыть
 * установленное приложение (whatsapp://), а если окно не потеряло фокус — открываем веб-версию в новой вкладке.
 * На телефоне ничего не перехватываем: ссылка wa.me сама открывает приложение.
 */
function whatsappClick(webHref: string, appHref: string) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    const touch = window.matchMedia('(pointer: coarse)').matches
    if (touch || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
    e.preventDefault()

    let left = false
    const mark = () => {
      left = true
    }
    window.addEventListener('blur', mark, { once: true })
    document.addEventListener('visibilitychange', mark, { once: true })

    window.location.href = appHref

    window.setTimeout(() => {
      window.removeEventListener('blur', mark)
      document.removeEventListener('visibilitychange', mark)
      if (!left) window.open(webHref, '_blank', 'noopener,noreferrer')
    }, 1800)
  }
}

export function getSocials(): Social[] {
  const list: Social[] = []

  if (c.telegram?.trim()) {
    const v = c.telegram.trim()
    list.push({ id: 'telegram', label: 'Telegram', href: isUrl(v) ? v : `https://t.me/${handle(v)}`, icon: Send })
  }

  if (c.whatsapp?.trim()) {
    const v = c.whatsapp.trim()
    if (isUrl(v)) {
      list.push({ id: 'whatsapp', label: 'WhatsApp', href: v, icon: MessageCircle })
    } else {
      const d = waDigits(v)
      const web = `https://wa.me/${d}`
      list.push({
        id: 'whatsapp',
        label: 'WhatsApp',
        href: web,
        icon: MessageCircle,
        onClick: whatsappClick(web, `whatsapp://send?phone=${d}`),
      })
    }
  }

  if (c.instagram?.trim()) {
    const v = c.instagram.trim()
    list.push({
      id: 'instagram',
      label: 'Instagram',
      href: isUrl(v) ? v : `https://www.instagram.com/${handle(v)}/`,
      icon: Instagram,
    })
  }

  if (c.twoGis?.trim()) {
    list.push({ id: '2gis', label: '2ГИС', href: c.twoGis.trim(), icon: MapPinned })
  }

  return list
}

/** Один раз на загрузку страницы: конфиг статичен */
export const socials = getSocials()
