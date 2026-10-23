import { Car, Phone, Wrench } from 'lucide-react'

export type LeadSummary = {
  serviceName: string
  vehicle: string
  phone: string
}

type Props = { summary: LeadSummary }

/** Экран успеха — показывается внутри того же bottom sheet */
export default function SuccessView({ summary }: Props) {
  const rows = [
    { icon: Wrench, text: summary.serviceName },
    { icon: Car, text: summary.vehicle },
    { icon: Phone, text: summary.phone },
  ]

  return (
    <div className="pt-2">
      <div className="flex items-start gap-3">
        <svg viewBox="0 0 48 48" className="h-12 w-12 shrink-0" aria-hidden>
          <circle cx="24" cy="24" r="23" className="fill-brand" />
          <path
            d="M14 25 L21 32 L34 17"
            pathLength={1}
            strokeDasharray="1 2"
            fill="none"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-draw-check stroke-brand-contrast"
          />
        </svg>
        <div>
          <p className="text-xl font-semibold leading-tight tracking-tight text-zinc-50">Заявка принята!</p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">
            Мастер свяжется с вами в ближайшее время для уточнения деталей
          </p>
        </div>
      </div>

      <div className="glass mt-5 space-y-3 rounded-2xl p-4 text-sm">
        {rows.map(({ icon: Icon, text }) => (
          <p key={text} className="flex items-start gap-3 text-zinc-100">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-fg" />
            <span className="min-w-0 break-words">{text}</span>
          </p>
        ))}
      </div>
    </div>
  )
}
