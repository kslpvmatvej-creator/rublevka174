/**
 * Готовит фото для блока «Наши работы»: берёт оригиналы из works-src/ и кладёт в public/works/
 * лёгкие WebP двух размеров с обрезкой под карточку 4:5 (400×500 и 800×1000).
 *
 * Один раз:  npm i -D sharp
 * Каждый раз: node scripts/optimize-works.mjs
 */
import { mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const SRC = 'works-src'
const OUT = 'public/works'
const WIDTHS = [400, 800]
const RATIO = 5 / 4 // высота / ширина

// Куда «смотреть» при обрезке под 4:5 (по умолчанию — автоматически по самому контрастному месту).
// Для вертикальных кадров из сторис обрезаем снизу, чтобы не попадали надписи сторис.
const POSITIONS = {
  'interior-panamera-before': 'top',
  'interior-panamera-after': 'top',
}

let names
try {
  names = (await readdir(SRC)).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f)).sort()
} catch {
  console.error(`Нет папки ${SRC}/ — создайте её и положите туда оригиналы (jpg, png, webp).`)
  process.exit(1)
}
if (names.length === 0) {
  console.error(`В ${SRC}/ нет фото.`)
  process.exit(1)
}

await mkdir(OUT, { recursive: true })

for (const name of names) {
  // Безопасное имя для URL: латиница, цифры и дефисы
  const slug = path.parse(name).name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'photo'
  for (const w of WIDTHS) {
    await sharp(path.join(SRC, name))
      .rotate() // учесть поворот из EXIF (фото с телефона)
      .resize({ width: w, height: Math.round(w * RATIO), fit: 'cover', position: POSITIONS[slug] ?? 'attention' })
      .webp({ quality: 78 })
      .toFile(path.join(OUT, `${slug}-${w}.webp`))
  }
  console.log(`✔ ${name}  →  file: '${slug}'`)
}
console.log(`\nГотово: ${names.length} шт. Впишите эти имена в поле file в PortfolioGallery.tsx`)
