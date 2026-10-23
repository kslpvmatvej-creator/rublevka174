import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Inbox, LayoutDashboard, Loader2, Lock, LogOut, Mail, Percent, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react'

import config from '../business.json'
import { supabase } from '../supabaseClient'
import Dashboard from '../components/admin/Dashboard'
import LeadsTable, { type LeadFilter } from '../components/admin/LeadsTable'
import Marketing from '../components/admin/Marketing'
import { cn } from '../lib/cn'
import type { Lead, LeadStatus } from '../lib/leads'

type Tab = 'dashboard' | 'leads' | 'marketing'

function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Обычный вход: signInWithPassword. Успех → onAuthStateChange в AdminView сам откроет админку
  const login = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !password || loading) return
    setLoading(true)
    setError(null)
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (authError) setError('Неверный email или пароль')
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <div className="glass mx-auto flex h-20 w-20 items-center justify-center rounded-3xl">
          <ShieldCheck className="h-10 w-10 text-brand-fg" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-50">Кабинет владельца</h1>
        <p className="mt-1 text-sm text-zinc-400">{config.name}</p>
      </div>
      <form onSubmit={login} className="space-y-3">
        <label className="glass flex items-center gap-3 rounded-2xl px-4 py-4 focus-within:ring-2 focus-within:ring-brand">
          <Mail className="h-5 w-5 text-brand-fg" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            aria-label="Email"
            className="w-full bg-transparent text-base outline-none placeholder:text-zinc-500"
          />
        </label>
        <label className="glass flex items-center gap-3 rounded-2xl px-4 py-4 focus-within:ring-2 focus-within:ring-brand">
          <Lock className="h-5 w-5 text-brand-fg" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            autoComplete="current-password"
            aria-label="Пароль"
            className="w-full bg-transparent text-base outline-none placeholder:text-zinc-500"
          />
        </label>
        {error && (
          <p role="alert" className="flex items-center gap-2 rounded-2xl bg-red-950/50 px-3 py-2 text-sm text-red-300">
            <TriangleAlert className="h-4 w-4" /> {error}
          </p>
        )}
        <button
          type="submit"
          disabled={!email || !password || loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 font-semibold text-brand-contrast transition active:scale-[0.98] disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Войти'}
        </button>
      </form>
    </main>
  )
}

const TABS: { id: Tab; label: string; icon: typeof Inbox }[] = [
  { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { id: 'leads', label: 'Заявки', icon: Inbox },
  { id: 'marketing', label: 'Маркетинг', icon: Percent },
]

/** Мини-CRM: дашборд, заявки из rublevka_leads, маркетинг (скидка) */
function AdminPanel() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<LeadFilter>('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setRefreshing(true)
    const { data, error: loadError } = await supabase
      .from('rublevka_leads')
      .select('id, created_at, service_name, client_name, client_phone, vehicle, comment, source, status')
      .order('created_at', { ascending: false })
      .limit(2000)
    if (loadError) {
      console.error(loadError)
      setError('Не удалось загрузить заявки. Проверьте соединение и что выполнен rublevka_admin.sql.')
    } else {
      setError(null)
      setLeads((data ?? []) as Lead[])
    }
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    void load()
    const timer = setInterval(() => void load(), 30000)
    return () => clearInterval(timer)
  }, [load])

  const changeStatus = async (lead: Lead, status: LeadStatus) => {
    if (status === lead.status || busyId) return
    const previous = lead.status
    setBusyId(lead.id)
    setError(null)
    setLeads((prev) => prev.map((x) => (x.id === lead.id ? { ...x, status } : x))) // сразу, без ожидания ответа
    const { data, error: updError } = await supabase.from('rublevka_leads').update({ status }).eq('id', lead.id).select('id')
    setBusyId(null)
    if (updError || !data?.length) {
      console.error(updError)
      setLeads((prev) => prev.map((x) => (x.id === lead.id ? { ...x, status: previous } : x))) // откат
      setError('Не удалось изменить статус (нет прав или нет соединения).')
    }
  }

  const openLeads = (status: LeadFilter = 'all') => {
    setFilter(status)
    setTab('leads')
    window.scrollTo({ top: 0 })
  }

  const fresh = leads.filter((l) => l.status === 'new').length

  return (
    <div className="min-h-dvh bg-black pb-10">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-black/80 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-white">{config.name}</p>
            <p className="text-[11px] text-zinc-500">CRM · кабинет владельца</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              aria-label="Обновить"
              className="glass flex h-10 w-10 items-center justify-center rounded-full text-zinc-300 transition hover:text-white active:scale-95"
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            </button>
            <button
              type="button"
              onClick={() => void supabase.auth.signOut()}
              aria-label="Выйти"
              className="glass flex h-10 w-10 items-center justify-center rounded-full text-zinc-300 transition hover:text-white active:scale-95"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav aria-label="Разделы" className="mx-auto w-full max-w-7xl px-4 pb-3">
          <div role="tablist" className="grid grid-cols-3 gap-1 rounded-2xl border border-white/5 bg-zinc-900/50 p-1 md:inline-grid md:w-auto">
            {TABS.map((t) => {
              const Icon = t.icon
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => (t.id === 'leads' ? openLeads(filter) : setTab(t.id))}
                  className={cn(
                    'relative flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-medium transition active:scale-[0.98]',
                    active ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                  {t.label}
                  {t.id === 'leads' && fresh > 0 && (
                    <span className={'min-w-5 rounded-full bg-brand px-1.5 text-[11px] font-semibold leading-5 tabular-nums text-brand-contrast'}>
                      {fresh}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pt-4">
        {error && (
          <p role="alert" className="mb-4 flex items-start gap-2 rounded-2xl bg-red-950/50 px-4 py-3 text-sm text-red-300">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </p>
        )}

        {tab === 'dashboard' && <Dashboard leads={leads} loading={loading} onOpenLeads={openLeads} />}
        {tab === 'leads' && (
          <LeadsTable leads={leads} loading={loading} filter={filter} onFilter={setFilter} onStatus={changeStatus} busyId={busyId} />
        )}
        {tab === 'marketing' && <Marketing />}
      </main>
    </div>
  )
}

export default function AdminView() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-fg" />
      </div>
    )
  }
  return session ? <AdminPanel /> : <AdminLogin />
}
