import { useEffect, useSyncExternalStore } from 'react'

import { supabase } from '../supabaseClient'

/** Глобальная скидка. Хранится в Supabase (rublevka_settings, строка id = 1), см. rublevka_admin.sql */
export type Promo = { enabled: boolean; percent: number }

export const PROMO_MIN = 1
export const PROMO_MAX = 90

const OFF: Promo = { enabled: false, percent: 10 }

let state: Promo = OFF
let loaded = false
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((l) => l())
const set = (next: Promo) => {
  if (next.enabled === state.enabled && next.percent === state.percent) return
  state = next
  emit()
}

/** Один раз за сессию подтягиваем скидку; при ошибке сайт просто показывает обычные цены */
export function loadPromo(force = false): Promise<void> {
  if (loaded && !force) return Promise.resolve()
  if (loading) return loading
  loading = (async () => {
    try {
      const { data, error } = await supabase
        .from('rublevka_settings')
        .select('discount_enabled, discount_percent')
        .eq('id', 1)
        .maybeSingle()
      if (error) throw error
      if (data) set({ enabled: !!data.discount_enabled, percent: Number(data.discount_percent) || OFF.percent })
      loaded = true
    } catch (e) {
      console.warn('promo: не удалось загрузить скидку (выполнен ли rublevka_admin.sql?)', e)
    } finally {
      loading = null
    }
  })()
  return loading
}

/** Сохранение из админки. Возвращает текст ошибки или null */
export async function savePromo(next: Promo): Promise<string | null> {
  const percent = Math.round(next.percent)
  if (!Number.isFinite(percent) || percent < PROMO_MIN || percent > PROMO_MAX) {
    return `Скидка должна быть от ${PROMO_MIN} до ${PROMO_MAX}%`
  }
  const { data, error } = await supabase
    .from('rublevka_settings')
    .update({ discount_enabled: next.enabled, discount_percent: percent, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select('id')
  if (error) {
    console.error(error)
    return 'Не удалось сохранить. Проверьте соединение.'
  }
  if (!data?.length) return 'Нет прав на изменение (проверьте email владельца в rublevka_admin.sql).'
  loaded = true
  set({ enabled: next.enabled, percent })
  return null
}

/** Подписка на скидку: компоненты сайта и админки обновляются сразу после сохранения */
export function usePromo() {
  const promo = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state
  )
  useEffect(() => {
    void loadPromo()
  }, [])
  return { ...promo, active: promo.enabled && promo.percent >= PROMO_MIN }
}

/** Цена со скидкой, округление до 10 ₽ */
export const applyDiscount = (price: number, percent: number) => Math.round((price * (100 - percent)) / 100 / 10) * 10
