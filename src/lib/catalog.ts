import {
  Armchair, Car, CalendarDays, Clock, Crown, Disc3, Droplets, Gem, Layers, Paintbrush, Shield, ShieldCheck,
  Sparkles, SprayCan, Sun, Truck, Wind, Wrench, Zap,
  type LucideIcon,
} from 'lucide-react'

import config from '../business.json'
import { formatPrice } from './format'

/** Услуга из прайса (business.json → services) */
export type Service = {
  id: string
  name: string
  category?: string
  /** Цена «от», ₽ */
  price: number
  /** Текст вместо цены («Индивидуальный расчёт», «После осмотра»); если задан — price и скидка игнорируются */
  priceLabel?: string
  description?: string
  icon?: string
  badge?: string
}

export const SERVICES = config.services as Service[]

/** Подпись цены для клиента: «от 3 000 ₽» или текстовая из priceLabel (без учёта скидки) */
export const servicePriceLabel = (s: Pick<Service, 'price' | 'priceLabel'>) =>
  s.priceLabel ?? `от ${formatPrice(s.price)}`

/* ---------- Иконки ---------- */

/** Реестр иконок: в business.json пишем "icon": "Gem" */
const ICONS: Record<string, LucideIcon> = {
  Armchair, Car, CalendarDays, Clock, Crown, Disc3, Droplets, Gem, Layers, Paintbrush, Shield, ShieldCheck,
  Sparkles, SprayCan, Sun, Truck, Wind, Wrench, Zap,
}
export const resolveIcon = (name?: string, fallback: LucideIcon = Sparkles): LucideIcon =>
  (name && ICONS[name]) || fallback
