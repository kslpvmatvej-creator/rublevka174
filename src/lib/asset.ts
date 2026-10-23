/**
 * Пути к локальным ассетам с учётом base из Vite (import.meta.env.BASE_URL):
 * '/' на локалке и '/rublevka174/' на GitHub Pages.
 * Внешние ссылки (http/https, //cdn…, data:, blob:) не трогаем.
 */
const BASE = import.meta.env.BASE_URL

const isExternal = (p: string) => /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(p)

export function withBase(path: string): string
export function withBase(path: undefined): undefined
export function withBase(path?: string): string | undefined
export function withBase(path?: string): string | undefined {
  if (!path) return path
  const p = path.trim()
  if (isExternal(p)) return p
  // Уже с префиксом base (например, '/rublevka174/hero/…') — второй раз не добавляем
  if (BASE !== '/' && p.startsWith(BASE)) return p
  return `${BASE}${p.replace(/^\/+/, '')}`
}

/** srcSet вида "/a-800.webp 800w, /a-1200.webp 1200w" → у каждого кандидата свой base */
export function withBaseSrcSet(srcSet?: string): string | undefined {
  if (!srcSet) return srcSet
  return srcSet
    .split(',')
    .map((part) => {
      const [url, ...descriptor] = part.trim().split(/\s+/)
      return [withBase(url), ...descriptor].join(' ')
    })
    .join(', ')
}
