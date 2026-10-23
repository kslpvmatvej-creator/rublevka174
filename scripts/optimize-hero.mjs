/**
 * Готовит фоновое фото главного экрана: берёт hero-src/fon.jpg и кладёт в public/hero/
 * лёгкие WebP трёх размеров БЕЗ обрезки (портрет 2:3): fon-800, fon-1200, fon-1600.
 * Обрезка под баннер делается в CSS (object-position в Hero.tsx).
 *
 * Один раз:  npm i -D sharp
 * Каждый раз: node scripts/optimize-hero.mjs
 */
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const SRC = 'hero-src/fon.jpg'
const OUT = 'public/hero'
const WIDTHS = [800, 1200, 1600]

await mkdir(OUT, { recursive: true })
for (const w of WIDTHS) {
  await sharp(SRC).rotate().resize({ width: w }).webp({ quality: 80 }).toFile(`${OUT}/fon-${w}.webp`)
  console.log(`✔ fon-${w}.webp`)
}
