import { cn } from '../lib/cn'
import { socials } from '../lib/contacts'

type Props = { className?: string; size?: 'sm' | 'md' }

/** Ряд круглых иконок-ссылок (шапка, подвал). Все открываются в новой вкладке. Ссылки — в business.json → contacts */
export default function SocialLinks({ className, size = 'md' }: Props) {
  if (socials.length === 0) return null
  return (
    <ul className={cn('flex items-center gap-2', className)}>
      {socials.map(({ id, label, href, icon: Icon, onClick }) => (
        <li key={id}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClick}
            aria-label={label}
            title={label}
            className={cn(
              'glass-dark flex items-center justify-center rounded-full text-zinc-300 transition hover:border-white/20 hover:text-white active:scale-95',
              size === 'sm' ? 'h-9 w-9' : 'h-10 w-10'
            )}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </a>
        </li>
      ))}
    </ul>
  )
}
