import business from '../business.json'

/**
 * Заставка загрузки (разметка и анимация — в index.html, чтобы появиться мгновенно, ещё до загрузки скриптов).
 * Здесь — только момент, когда её убрать: когда готовы главное фото и шрифты, но не раньше MIN_MS
 * (чтобы анимация доиграла) и не позже MAX_MS (чтобы медленный интернет не держал клиента на заставке).
 * Показывается при первом визите и если клиент не заходил 12 часов. Принудительно: добавить ?splash к адресу.
 */
const MIN_MS = 1400
const MAX_MS = 3500
const FADE_MS = 650

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

export function runSplash() {
  const el = document.getElementById('splash')
  if (!el) return
  const root = document.documentElement

  if (root.classList.contains('no-splash')) {
    el.remove()
    return
  }

  // Отсчёт — от момента, когда заставка появилась на экране (а не от открытия вкладки)
  const t0 = Number(root.dataset.sp0) || 0
  const sinceStart = () => performance.now() - t0

  const hero = new Promise<void>((resolve) => {
    const img = new Image()
    img.referrerPolicy = 'no-referrer'
    img.addEventListener('load', () => resolve())
    img.addEventListener('error', () => resolve())
    img.src = business.hero.photo
    if (img.complete) resolve()
  })
  const fonts = document.fonts?.ready ?? Promise.resolve()
  const ready = Promise.all([hero, fonts]).then(() => undefined)

  Promise.race([ready, wait(Math.max(0, MAX_MS - sinceStart()))])
    .then(() => wait(Math.max(0, MIN_MS - sinceStart())))
    .then(() => {
      el.classList.add('sp-out')
      try {
        localStorage.setItem('rb-splash', String(Date.now()))
      } catch {
        /* приватный режим: не страшно, заставка просто покажется снова */
      }
      return wait(FADE_MS)
    })
    .then(() => {
      el.remove()
      root.classList.add('sp-done')
    })
}
