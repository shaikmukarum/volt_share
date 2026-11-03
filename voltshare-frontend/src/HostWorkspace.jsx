import React, { useEffect, useRef, useState } from 'react';
import { Zap, Plug, Receipt, Phone, LayoutDashboard, ChevronDown, TrendingUp, Sun, User, LogOut, MapPin, Loader2, Send, KeyRound, ArrowRight, Leaf, Mail, Bell, ShieldCheck, CreditCard, Check, History as HistoryIcon } from 'lucide-react';
import { statusLabel } from './ui/tokens.js';

const TABS = [
  { id: 'home', nav: 'Home', side: 'Home / Overview', icon: LayoutDashboard },
  { id: 'console', nav: 'Host Console', side: 'Host Console', icon: Plug },
  { id: 'history', nav: 'History', side: 'History & Earnings', icon: Receipt },
  { id: 'support', nav: 'Support', side: 'Support', icon: Phone }
];
const FAQ = [
  ['How do I add a new charger?', 'Open Host Console, enter a listing title, area, full address, connector, power and a tariff between ₹11 and ₹16 per kWh, then press Publish charger listing. Your full address stays hidden until you approve a booking.'],
  ['When do I get my earnings?', 'Right away. When you enter the kWh delivered and complete a session, your payout (units × your rate) is credited to your VoltShare wallet balance.'],
  ['How to resolve a driver complaint?', 'Send us the booking number and what happened using the form on this page. Our team reviews the session record (OTP handshake and kWh log) and replies by email.'],
  ['What are the commission charges?', 'VoltShare adds a 10% platform convenience fee on top of your tariff and bills it to the driver, so you receive the full units × rate.']
];

const lift = 'hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)]';
const h1c = 'font-display font-semibold tracking-tight text-[#0F172A] dark:text-zinc-50';
const muted = 'text-slate-600 dark:text-zinc-400';
const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F7F2] dark:focus-visible:ring-offset-[#0A120E]';
const inputC = 'w-full rounded-xl border border-slate-200 bg-[#FAF7F2] px-4 py-2.5 text-sm text-[#0F172A] outline-none transition placeholder:text-slate-400 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 dark:border-white/10 dark:bg-[#0C1713] dark:text-zinc-100 dark:placeholder:text-zinc-600';
const btn = `inline-flex items-center justify-center gap-2 rounded-full bg-[#15803D] px-6 py-3 text-sm font-semibold text-snow shadow-lg shadow-green-900/15 transition duration-200 hover:-translate-y-0.5 hover:bg-[#166534] disabled:opacity-60 disabled:hover:translate-y-0 ${focus}`;
const btnGhost = `inline-flex items-center justify-center gap-2 rounded-full border border-[#15803D]/30 bg-snow/60 px-5 py-2.5 text-sm font-semibold text-[#15803D] transition hover:bg-green-50 disabled:opacity-60 dark:bg-transparent dark:text-emerald-300 dark:hover:bg-white/5 ${focus}`;
const pill = (s) => (s === 'COMPLETED' ? 'bg-[#15803D] text-snow' : s === 'CANCELLED' ? 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-zinc-400' : s === 'CHARGING_ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300');
const inr = (n) => `₹${(Number(n) || 0).toFixed(2)}`;
const ago = (d) => { if (!d) return ''; const m = Math.round((Date.now() - new Date(d).getTime()) / 60000); if (!(m >= 0)) return ''; return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.floor(m / 60)} h ago` : `${Math.floor(m / 1440)} d ago`; };
const fmt = (d) => { if (!d) return '—'; const t = new Date(d); return Number.isNaN(t.getTime()) ? String(d) : t.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }); };

const glass = 'rounded-[24px] border border-[#15803D]/[0.12] bg-snow/[0.86] shadow-[0_20px_40px_rgba(15,23,42,0.08)] backdrop-blur-[16px] transition duration-300 dark:border-white/10 dark:bg-[#12201A]/85';
const glassHome = glass;
const glassConsole = `${glass} p-8`;
const glassHistory = glass;
const glassSupport = glass;
const inputS = inputC.replace('bg-[#FAF7F2]', 'bg-[#f7f6f1]');

/* Page scene: warm cream canvas with soft-focus photographic foliage in the outer corners (masked, never touching the copy)
   and, on the console tab, the sunlit house + wallbox photo dissolving into the cream on every edge. */
const TAB_BG = { home: '/images/bg-home.webp', console: '/images/bg-console.webp', history: '/images/bg-history.webp', support: '/images/bg-support.webp', settings: '/images/bg-console.webp' };
function Scene({ bg = '', children }) {
  return (
    <section className={`relative isolate ${bg}`}>
      <div className="relative mx-auto w-full max-w-7xl px-6 pb-20 pt-10 lg:px-10">{children}</div>
    </section>
  );
}

/* Slim rounded columns (max 38px) with dashed grid lines. `pills` renders the 6 mini 12px pill bars on a sage track. */
function Bars({ data, tall, pills }) {
  const [on, setOn] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setOn(true)); return () => cancelAnimationFrame(id); }, []);
  const max = Math.max(...data.map((d) => d.v), 1);
  if (pills) {
    const slots = Array.from({ length: 6 }, (_, i) => data[data.length - 6 + i] || data[i - (6 - data.length)] || null);
    return (
      <div className="flex h-24 items-end justify-between gap-2 px-1">
        {slots.map((d, i) => (
          <div key={i} title={d ? `${d.k}: ${d.t}` : ''} className="relative flex h-full w-3 items-end overflow-hidden rounded-full bg-[#DCEBDD] dark:bg-white/10">
            <div className="w-full rounded-full bg-gradient-to-t from-[#15803D] to-[#22C55E] transition-[height] duration-700 ease-out" style={{ height: on && d ? `${Math.max((d.v / max) * 100, 14)}%` : '0%', transitionDelay: `${i * 60}ms` }} />
          </div>
        ))}
      </div>
    );
  }
  const ticks = [1, 0.75, 0.5, 0.25];
  return (
    <div className="relative pl-1">
      <div className="relative h-52">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden="true">
          {[...ticks, 0].map((t) => (<div key={t} className="border-t border-dashed border-[#15803D]/15 dark:border-white/10" />))}
        </div>
        <div className="relative flex h-full items-end justify-around gap-4 px-2">
          {data.map((d, i) => (
            <div key={d.k} title={`${d.k}: ${d.t}`} className="group flex h-full min-w-0 max-w-[38px] flex-1 flex-col justify-end">
              <span className="mb-1 text-center text-[10px] font-semibold text-[#15803D] opacity-0 transition group-hover:opacity-100 dark:text-emerald-300">{d.t}</span>
              <div className="w-full rounded-t-[10px] rounded-b-[4px] bg-gradient-to-t from-[#15803D] to-[#22C55E] transition-[height] duration-700 ease-out group-hover:brightness-110" style={{ height: on ? `${Math.max((d.v / max) * 86, 4)}%` : '0%', transitionDelay: `${i * 50}ms` }} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-around gap-4 px-2">
        {data.map((d) => (<span key={d.k} className="min-w-0 max-w-[38px] flex-1 truncate text-center text-[10px] text-slate-500 dark:text-zinc-500">{d.k}</span>))}
      </div>
    </div>
  );
}

function Field({ id, label, children }) {
  return (<div><label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-[#0F172A] dark:text-zinc-200">{label}</label>{children}</div>);
}

export default function HostWorkspace({ ctx }) {
  const { user, logout, hostBookings: bookings, charger: ch, contact: c, latestBill, otpInput, setOtpInput, unitsInput, setUnitsInput, onApprove, onStart, onComplete, busy } = ctx;
  const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const put = (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } };
  const dark = ctx.theme === 'dark';
  const changeTheme = ctx.changeTheme;
  const [tab, setTab] = useState(ctx.initialTab || 'home');
  const [online, setOnline] = useState(() => get('vs-online') !== 'off');
  const [menu, setMenu] = useState(false);
  const [metric, setMetric] = useState('rev');
  const [faq, setFaq] = useState(0);
  const [notify, setNotify] = useState(() => get('vs-notify') !== 'off');
  const [saved, setSaved] = useState(false);
  const menuRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 0); onScroll(); window.addEventListener('scroll', onScroll, { passive: true }); return () => window.removeEventListener('scroll', onScroll); }, []);

  useEffect(() => { put('vs-online', online ? 'on' : 'off'); }, [online]);
  useEffect(() => { if (ctx.view === 'history') setTab('history'); else if (ctx.view === 'contact') setTab('support'); }, [ctx.view]);
  useEffect(() => {
    if (!menu) return undefined;
    const down = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    const key = (e) => { if (e.key === 'Escape') setMenu(false); };
    document.addEventListener('mousedown', down);
    window.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); window.removeEventListener('keydown', key); };
  }, [menu]);

  /* ---- numbers computed from the host's existing booking data ---- */
  const done = bookings.filter((b) => b.status === 'COMPLETED').map((b) => ({ ...b, units: Number(b.units_consumed_kwh) || 0, payout: Number(b.host_payout) || 0 })).sort((a, b) => a.booking_id - b.booking_id);
  const revenue = done.reduce((t, r) => t + r.payout, 0);
  const energy = done.reduce((t, r) => t + r.units, 0);
  const avgRate = energy ? revenue / energy : 0;
  const activeCount = bookings.filter((b) => b.status === 'CHARGING_ACTIVE').length;
  const ORDER = { REQUESTED: 0, APPROVED: 1, CHARGING_ACTIVE: 2 };
  const open = bookings.filter((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED').sort((a, b) => (ORDER[a.status] ?? 3) - (ORDER[b.status] ?? 3) || b.booking_id - a.booking_id);
  const series = done.slice(-12).map((r) => ({ k: `#${r.booking_id}`, v: metric === 'rev' ? r.payout : r.units, t: metric === 'rev' ? inr(r.payout) : `${r.units} kWh` }));
  const mini = done.slice(-6).map((r) => ({ k: `#${r.booking_id}`, v: r.payout, t: inr(r.payout) }));
  const name = user?.full_name || 'Host';
  const go = (id) => { setTab(id); setMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const stepIdx = { REQUESTED: 0, APPROVED: 1, CHARGING_ACTIVE: 2 };

  const crumbs = (label) => (
    <p className={`mb-3 flex items-center gap-2 text-xs ${muted}`}>
      <button type="button" onClick={() => go('home')} className={`flex items-center gap-1 rounded hover:text-[#15803D] ${focus}`}>← Host workspace</button>
      <span aria-hidden="true">›</span><span className="font-medium text-[#0F172A] dark:text-zinc-200">{label}</span>
    </p>
  );

  const reqCard = (b) => (
    <article key={b.booking_id} className={`rounded-2xl border border-[#15803D]/10 bg-[#F8F7F2]/80 p-4 dark:border-white/10 dark:bg-[#0C1713]/70 ${lift}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">Booking #{b.booking_id} · {b.driver_name}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${pill(b.status)}`}>{statusLabel(b.status, 'host')}</span>
        {Boolean(b.is_sos_emergency) && <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">SOS</span>}
      </div>
      <p className={`mt-1 text-xs ${muted}`}>{b.title} · ₹{b.price_per_kwh}/kWh · {b.created_at ? `requested ${ago(b.created_at)}` : fmt(b.slot_start)}{b.driver_phone && b.status !== 'REQUESTED' ? ` · ${b.driver_phone}` : ''}</p>
      <ol className="mt-3 flex gap-1.5 text-[10px] font-semibold">
        {['Accept', 'Driver OTP', 'kWh & settle'].map((s, i) => (<li key={s} className={`flex-1 rounded-full px-2 py-1 text-center ${i <= stepIdx[b.status] ? 'bg-[#15803D] text-snow' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-zinc-500'}`}>{s}</li>))}
      </ol>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {b.status === 'REQUESTED' && (
          <button type="button" disabled={!!busy} onClick={() => onApprove(b.booking_id)} className={btn}>
            {busy === `approve-${b.booking_id}` && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Accept Request
          </button>
        )}
        {b.status === 'APPROVED' && (
          <>
            <label htmlFor={`otp-${b.booking_id}`} className="sr-only">Driver's 4-digit OTP</label>
            <input id={`otp-${b.booking_id}`} inputMode="numeric" maxLength={4} placeholder="Enter Driver OTP" value={otpInput[b.booking_id] || ''} onChange={(e) => setOtpInput({ ...otpInput, [b.booking_id]: e.target.value })} className={`${inputC} w-40 text-center font-mono tracking-widest`} />
            <button type="button" disabled={!!busy} onClick={() => onStart(b.booking_id)} className={btnGhost}>
              {busy === `otp-${b.booking_id}` ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <KeyRound className="h-4 w-4" aria-hidden="true" />}Verify OTP
            </button>
          </>
        )}
        {b.status === 'CHARGING_ACTIVE' && (
          <>
            <label htmlFor={`kwh-${b.booking_id}`} className="sr-only">Units delivered in kWh</label>
            <input id={`kwh-${b.booking_id}`} type="number" min="0" step="0.1" placeholder="kWh delivered" value={unitsInput[b.booking_id] || ''} onChange={(e) => setUnitsInput({ ...unitsInput, [b.booking_id]: e.target.value })} className={`${inputC} w-36`} />
            <button type="button" disabled={!!busy} onClick={() => onComplete(b.booking_id)} className={btn}>
              {busy === `complete-${b.booking_id}` && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Enter kWh &amp; Complete Session
            </button>
          </>
        )}
      </div>
    </article>
  );

  /* ---------------- TAB 1: HOME ---------------- */
  const onlineCard = (
    <div className={`${glassHome} flex items-center gap-3 p-3 pr-4`}>
      <span className="relative grid h-9 w-9 shrink-0 place-items-center">
        {online && <span className="absolute inset-0 animate-ping rounded-full bg-[#16A34A]/30" />}
        <span className={`relative h-3.5 w-3.5 rounded-full ${online ? 'bg-[#16A34A] shadow-[0_0_12px_#16A34A]' : 'bg-slate-400'}`} />
      </span>
      <div className="min-w-0 flex-1 leading-tight"><p className="text-sm font-semibold">{online ? 'Online' : 'Paused'}</p><p className={`truncate text-xs ${muted}`}>{online ? 'Your charger is active' : 'Paused on this device'}</p></div>
      <button type="button" role="switch" aria-checked={online} aria-label="Toggle charger availability" onClick={() => setOnline(!online)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${online ? 'bg-[#15803D]' : 'bg-slate-300 dark:bg-white/20'} ${focus}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-snow shadow transition-all ${online ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
  const home = (
    <section className="relative isolate">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_55%_70%_at_28%_48%,rgba(255,253,246,0.45),transparent_70%)] dark:hidden" aria-hidden="true" />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col justify-center gap-10 px-6 py-16 lg:flex-row lg:items-center lg:gap-10 lg:px-10">
        <div className="max-w-md lg:w-[40%]">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#15803D] dark:text-emerald-400">Welcome back, {name.split(' ')[0]}</p>
          <h1 className={`${h1c} mt-3 text-5xl leading-[1.05] sm:text-6xl`}>Let’s power a greener tomorrow.</h1>
          <p className={`mt-5 max-w-md text-base leading-relaxed ${muted}`}>Manage your chargers, track your earnings and grow your contribution to clean energy.</p>
          <button type="button" onClick={() => go('history')} className={`${btn} mt-8`}>View All Sessions <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-3 lg:ml-[4%] lg:w-[290px]">
          <div className={`${glassHome} ${lift} p-5`}>
            <div className="flex items-start justify-between"><p className={`text-xs font-medium ${muted}`}>Total Earnings</p><TrendingUp className="h-5 w-5 text-[#16A34A]" aria-hidden="true" /></div>
            <p className="mt-1 text-3xl font-bold tracking-tight text-[#15803D] dark:text-emerald-400">{inr(revenue)}</p>
          </div>
          <div className={`${glassHome} ${lift} p-5`}>
            <div className="flex items-start justify-between"><p className={`text-xs font-medium ${muted}`}>Active Sessions</p><Zap className="h-5 w-5 text-[#16A34A]" aria-hidden="true" /></div>
            <p className="mb-4 mt-1 text-3xl font-bold">{activeCount}</p>
            {mini.length ? <Bars data={mini} pills /> : <p className={`text-xs ${muted}`}>Your earnings bars appear after your first completed session.</p>}
          </div>
          <div className="lg:hidden">{onlineCard}</div>
        </div>
        <div className="hidden lg:absolute lg:bottom-14 lg:right-10 lg:block lg:w-[290px]">{onlineCard}</div>
      </div>
    </section>
  );

  /* ---------------- TAB 2: HOST CONSOLE ---------------- */
  const consoleTab = (
    <Scene>
    <div>
      <div className="relative mb-8">
        <div className="pointer-events-none absolute -inset-x-10 -inset-y-6 -z-10 bg-[radial-gradient(ellipse_70%_90%_at_20%_50%,rgba(255,253,246,0.5),rgba(255,253,246,0.25)_60%,transparent)] dark:hidden" aria-hidden="true" />
        {crumbs('Provide a charger')}
        <h1 className={`${h1c} text-5xl`}>Host console</h1>
        <p className={`mt-2 max-w-md text-base ${muted}`}>List your idle home charger, verify drivers and settle every session.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="hc-list" className={glassConsole}>
          <h2 id="hc-list" className={`${h1c} text-2xl`}>List your idle home charger</h2>
          <p className={`mb-5 mt-1 text-xs font-medium ${muted}`}>Fair-price guardrail: ₹11 to ₹16 per kWh</p>
          <form onSubmit={ch.onSubmit} className="space-y-4">
            <Field id="hc-title" label="Charger listing title"><input id="hc-title" required placeholder="e.g. 7.2 kW AC wallbox, Block B" value={ch.title} onChange={(e) => ch.setTitle(e.target.value)} className={inputC} /></Field>
            <Field id="hc-area" label="Area name (shown publicly in search)"><input id="hc-area" required value={ch.area} onChange={(e) => ch.setArea(e.target.value)} className={inputC} /></Field>
            <Field id="hc-addr" label="Full house address (hidden until you approve)"><textarea id="hc-addr" rows={2} required value={ch.address} onChange={(e) => ch.setAddress(e.target.value)} className={`${inputC} resize-none`} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="hc-conn" label="Connector">
                <select id="hc-conn" value={ch.connector} onChange={(e) => ch.setConnector(e.target.value)} className={inputC}>
                  <option value="15A_Socket">15A Socket</option><option value="Type2_Wallbox">Type-2 Wallbox</option><option value="CCS2">CCS2 Fast</option>
                </select>
              </Field>
              <Field id="hc-power" label="Power (kW)"><input id="hc-power" type="number" step="0.1" min="0" value={ch.power} onChange={(e) => ch.setPower(e.target.value)} className={inputC} /></Field>
            </div>
            <div className="rounded-xl border border-[#15803D]/10 bg-[#ECF4EE]/70 p-4 dark:border-white/10 dark:bg-[#0C1713]">
              <div className="flex items-center justify-between text-xs"><label htmlFor="hc-price" className={muted}>Tariff rate (₹11 – ₹16)</label><span className="text-lg font-bold text-[#15803D] dark:text-emerald-400">₹{ch.price} / kWh</span></div>
              <input id="hc-price" type="range" min="11" max="16" step="0.5" value={ch.price} onChange={(e) => ch.setPrice(parseFloat(e.target.value))} className={`mt-2 w-full cursor-pointer accent-[#15803D] ${focus}`} />
              <div className={`flex justify-between text-[11px] ${muted}`}><span>₹11 floor</span><span>₹16 ceiling</span></div>
            </div>
            <button type="submit" disabled={busy === 'register'} className={`${btn} w-full`}>{busy === 'register' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Publish charger listing</button>
          </form>
        </section>
        <div className="space-y-6">
          <section aria-labelledby="hc-req" className={glassConsole}>
            <div className="flex items-start justify-between gap-3">
              <h2 id="hc-req" className={`${h1c} text-2xl`}>Incoming requests and live sessions</h2>
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-[#15803D] dark:bg-emerald-500/15 dark:text-emerald-300"><span className="h-2 w-2 animate-pulse rounded-full bg-[#16A34A]" />Live</span>
            </div>
            <p className={`mb-5 mt-2 text-sm leading-relaxed ${muted}`}>Accept a request, enter the driver’s 4-digit OTP when they arrive, then log the kWh delivered. This list refreshes automatically.</p>
            {open.length === 0 ? (
              <p className="flex items-center gap-3 rounded-xl bg-[#ECF4EE] p-4 text-sm text-slate-600 dark:bg-[#0C1713] dark:text-zinc-400"><Leaf className="h-4 w-4 shrink-0 text-[#16A34A]" aria-hidden="true" />No open requests right now. New driver requests will appear here.</p>
            ) : (<div className="space-y-3">{open.map(reqCard)}</div>)}
          </section>
          {latestBill && (
            <section aria-labelledby="hc-bill" className={glassConsole}>
              <h2 id="hc-bill" className="flex items-center gap-2 text-base font-semibold text-[#15803D] dark:text-emerald-400"><Receipt className="h-4 w-4" aria-hidden="true" />Session billing breakdown</h2>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                {[['Units consumed', `${latestBill.units_consumed_kwh} kWh`], ['Your net profit', `+₹${latestBill.sharma_uncle_net_profit}`], ['EB recovery (@ ₹8)', `₹${latestBill.electricity_bill_recovery}`], ['Total paid by driver', `₹${latestBill.driver_total_payable}`]].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-[#ECF4EE]/70 p-3 dark:bg-[#0C1713]"><dt className={muted}>{k}</dt><dd className="mt-1 text-lg font-semibold">{v}</dd></div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </div>
    </div>
    </Scene>
  );

  /* ---------------- TAB 3: HISTORY & EARNINGS ---------------- */
  const th = 'whitespace-nowrap px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-zinc-400';
  const td = 'px-4 py-4 align-top text-sm';
  const history = (
    <Scene>
    <div className="space-y-8">
      <div className="relative">
        <div className="pointer-events-none absolute -inset-x-10 -inset-y-6 -z-10 bg-[radial-gradient(ellipse_70%_90%_at_20%_50%,rgba(255,253,246,0.5),rgba(255,253,246,0.25)_60%,transparent)] dark:hidden" aria-hidden="true" />
        {crumbs('History')}
        <h1 className={`${h1c} text-5xl`}>Charging history</h1>
        <p className={`mt-2 text-base ${muted}`}>{bookings.length} charging session{bookings.length === 1 ? '' : 's'} in total, {done.length} completed.</p>
      </div>
      <section aria-labelledby="hh-an" className={`${glassHistory} p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="hh-an" className={`${h1c} text-2xl`}>Total earnings &amp; energy</h2>
          <div role="group" aria-label="Chart metric" className="flex rounded-full bg-[#ECF4EE] p-1 text-xs font-semibold dark:bg-[#0C1713]">
            {[['rev', 'Earnings (₹)'], ['kwh', 'Energy (kWh)']].map(([k, l]) => (<button key={k} type="button" aria-pressed={metric === k} onClick={() => setMetric(k)} className={`rounded-full px-4 py-1.5 transition ${metric === k ? 'bg-[#15803D] text-snow shadow' : muted} ${focus}`}>{l}</button>))}
          </div>
        </div>
        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="rounded-2xl bg-[#F4F1EA]/70 p-5 dark:bg-[#0C1713]/70">
            {series.length ? <Bars key={metric} data={series} tall /> : <p className={`py-16 text-center text-sm ${muted}`}>Complete a session to see your earnings graph.</p>}
          </div>
          <div className="grid gap-3">
            {[['Total Revenue Earned', inr(revenue)], ['Total Energy Delivered', `${energy.toFixed(1)} kWh`], ['Average Tariff Rate', `₹${avgRate.toFixed(2)} / kWh`]].map(([k, v]) => (
              <div key={k} className={`rounded-2xl border border-[#15803D]/10 bg-[#ECF4EE]/70 p-4 dark:border-white/10 dark:bg-[#0C1713] ${lift}`}><p className={`text-xs ${muted}`}>{k}</p><p className="mt-1 text-xl font-bold text-[#15803D] dark:text-emerald-400">{v}</p></div>
            ))}
          </div>
        </div>
      </section>
      <section aria-label="Past sessions" className={`${glassHistory} overflow-hidden p-2 sm:p-3`}>
        {bookings.length === 0 ? (<p className={`p-6 text-sm ${muted}`}>No sessions yet. Bookings on your chargers will be listed here.</p>) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[#ECF4EE] dark:bg-[#16261E]"><tr>{['Booking', 'Station', 'Date & time', 'Status', 'Driver / phone', 'Address'].map((h, i) => <th key={h} scope="col" className={`${th} ${i === 0 ? 'rounded-l-xl' : ''} ${i === 5 ? 'rounded-r-xl' : ''}`}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#15803D]/10 dark:divide-white/10">
                {[...bookings].map((b) => (
                  <tr key={b.booking_id} className="transition hover:bg-[#ECF4EE]/40 dark:hover:bg-white/5">
                    <td className={`${td} font-mono font-semibold`}>#{b.booking_id}</td>
                    <td className={td}><span className="font-semibold">{b.power_kw ? `${b.power_kw}KW ` : ''}{b.title}</span>{b.status === 'COMPLETED' && <span className={`block text-xs ${muted}`}>{Number(b.units_consumed_kwh) || 0} kWh · {inr(b.host_payout)}</span>}</td>
                    <td className={`${td} whitespace-nowrap`}>{fmt(b.actual_end_time || b.slot_start)}</td>
                    <td className={td}><span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${pill(b.status)}`}>{statusLabel(b.status, 'host')}</span></td>
                    <td className={td}>{b.driver_name}<span className={`block text-xs ${muted}`}>{b.driver_phone || '—'}</span></td>
                    <td className={`${td} min-w-[14rem]`}>{b.full_address ? <span className="inline-flex items-start gap-1.5 font-medium text-[#15803D] dark:text-emerald-400"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{b.full_address}</span> : <span className={muted}>{b.area_name}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
    </Scene>
  );

  /* ---------------- TAB 4: SUPPORT ---------------- */
  const err = (m) => m && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{m}</p>;
  const support = (
    <Scene>
    <div>
      {crumbs('Support')}
      <h1 className={`${h1c} text-5xl`}>Contact support</h1>
      <p className={`mb-8 mt-2 text-base ${muted}`}>Facing any issue? We’re here to help.</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="hs-faq">
          <h2 id="hs-faq" className={`${h1c} mb-4 text-2xl`}>Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQ.map(([q, a], i) => (
              <div key={q} className={`${glassSupport} ${lift}`}>
                <button type="button" aria-expanded={faq === i} onClick={() => setFaq(faq === i ? -1 : i)} className={`flex w-full items-center justify-between gap-3 rounded-[20px] px-5 py-4 text-left text-sm font-semibold ${focus}`}>
                  {q}<ChevronDown className={`h-4 w-4 shrink-0 text-[#15803D] transition-transform duration-300 ${faq === i ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                <div className={`grid transition-[grid-template-rows] duration-300 ${faq === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}><div className="overflow-hidden"><p className={`px-5 pb-4 text-sm leading-relaxed ${muted}`}>{a}</p></div></div>
              </div>
            ))}
          </div>
        </section>
        <form onSubmit={c.onSubmit} noValidate className={`${glassSupport} p-6`}>
          <h2 className={`${h1c} text-2xl`}>Send a message</h2>
          {c.status.text && <p role={c.status.type === 'error' ? 'alert' : 'status'} className={`mt-4 rounded-xl px-4 py-3 text-sm ${c.status.type === 'error' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' : 'bg-green-50 text-green-800 dark:bg-emerald-500/15 dark:text-emerald-300'}`}>{c.status.text}</p>}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field id="hs-name" label="Name"><input id="hs-name" autoComplete="name" value={c.name} onChange={(e) => c.setName(e.target.value)} className={inputC} />{err(c.errors.name)}</Field>
            <Field id="hs-email" label="Email"><input id="hs-email" type="email" autoComplete="email" value={c.email} onChange={(e) => c.setEmail(e.target.value)} className={inputC} />{err(c.errors.email)}</Field>
          </div>
          <div className="mt-4"><Field id="hs-sub" label="Subject or station ID"><input id="hs-sub" placeholder="e.g. Booking #2, Green Park wallbox" value={c.subject} onChange={(e) => c.setSubject(e.target.value)} className={inputC} />{err(c.errors.subject)}</Field></div>
          <div className="mt-4"><Field id="hs-msg" label="Message"><textarea id="hs-msg" rows={5} placeholder="Type your message…" value={c.message} onChange={(e) => c.setMessage(e.target.value)} className={`${inputS} resize-none`} />{err(c.errors.message)}</Field></div>
          <button type="submit" disabled={c.busy} className={`${btn} mt-5 w-full !bg-[#166534] hover:!bg-[#14532d]`}>{c.busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}Send message</button>
        </form>
      </div>
    </div>
    </Scene>
  );

  /* ---------------- ACCOUNT SETTINGS (opened from the profile menu) ---------------- */
  const tile = `${glass} flex items-start gap-4 p-5 ${lift}`;
  const tileIcon = 'grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#E3F1E6] text-[#15803D] dark:bg-emerald-500/15 dark:text-emerald-300';
  const settings = (
    <Scene>
      <div className="relative">
        <div className="pointer-events-none absolute -inset-x-10 -inset-y-6 -z-10 bg-[radial-gradient(ellipse_70%_90%_at_20%_50%,rgba(255,253,246,0.5),rgba(255,253,246,0.25)_60%,transparent)] dark:hidden" aria-hidden="true" />
        {crumbs('Account Settings')}
        <h1 className={`${h1c} text-5xl`}>Account Settings</h1>
        <p className={`mb-8 mt-2 text-base ${muted}`}>Manage your account and preferences.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-4 sm:grid-cols-2">
          <button type="button" onClick={() => ctx.onProfile()} className={`${tile} text-left ${focus}`}>
            <span className={tileIcon}><User className="h-6 w-6" aria-hidden="true" /></span>
            <span><span className="block text-base font-semibold">Profile</span><span className={`mt-1 block text-sm ${muted}`}>Update your personal details.</span></span>
          </button>
          <div className={tile}>
            <span className={tileIcon}><CreditCard className="h-6 w-6" aria-hidden="true" /></span>
            <div><p className="text-base font-semibold">Billing</p><p className={`mt-1 text-sm ${muted}`}>Payouts are credited to your VoltShare wallet.</p></div>
          </div>
          <div className={tile}>
            <span className={tileIcon}><ShieldCheck className="h-6 w-6" aria-hidden="true" /></span>
            <div><p className="text-base font-semibold">Security</p><p className={`mt-1 text-sm ${muted}`}>Drivers are verified with a 4-digit OTP on arrival.</p></div>
          </div>
          <div className={tile}>
            <span className={tileIcon}><Bell className="h-6 w-6" aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3"><p className="text-base font-semibold">Notifications</p>
                <button type="button" role="switch" aria-checked={notify} aria-label="Toggle notifications" onClick={() => { setNotify(!notify); setSaved(false); }} className={`relative h-6 w-11 shrink-0 rounded-full transition ${notify ? 'bg-[#15803D]' : 'bg-slate-300 dark:bg-white/20'} ${focus}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-snow shadow transition-all ${notify ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
              <p className={`mt-1 text-sm ${muted}`}>Choose what you want to be notified about.</p>
            </div>
          </div>
        </div>
        <div className={`${glass} p-6`}>
          <div className="flex items-center gap-3"><Sun className="h-7 w-7 text-amber-500" aria-hidden="true" /><div><p className={`${h1c} text-xl`}>Theme</p><p className={`text-sm ${muted}`}>Switch between light and dark mode.</p></div></div>
          <div role="group" aria-label="Theme" className="mt-5 grid grid-cols-2 gap-3">
            {[['Light', false], ['Dark', true]].map(([l, v]) => (<button key={l} type="button" aria-pressed={dark === v} onClick={() => changeTheme(v ? 'dark' : 'light')} className={`rounded-full py-3 text-sm font-semibold transition ${dark === v ? 'bg-[#15803D] text-snow shadow-lg shadow-green-900/20' : 'border border-[#15803D]/15 bg-snow/70 dark:bg-white/5'} ${focus}`}>{l}</button>))}
          </div>
          <button type="button" onClick={() => { put('vs-notify', notify ? 'on' : 'off'); setSaved(true); }} className={`${btn} mt-5 w-full`}>{saved ? <Check className="h-4 w-4" aria-hidden="true" /> : null}{saved ? 'Saved' : 'Save Changes'}</button>
          {saved && <p role="status" className={`mt-2 text-center text-xs ${muted}`}>Preferences saved on this device.</p>}
        </div>
      </div>
    </Scene>
  );

  const pages = { home, console: consoleTab, history, support, settings };
  const item = `flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition hover:bg-[#ECF4EE] dark:hover:bg-white/5 ${focus}`;

  return (
    <div>
      <div className="relative isolate min-h-screen overflow-x-hidden text-[#0F172A] antialiased transition-colors duration-300 dark:text-zinc-100" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {/* Full-bleed photographic backdrop, one per tab: fixed and sharp */}
        <img key={tab} src={TAB_BG[tab] || TAB_BG.home} alt="" aria-hidden="true" className="pointer-events-none fixed inset-0 -z-20 h-screen w-screen select-none object-cover object-[75%_center] dark:brightness-[0.55]" style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', objectFit: 'cover' }} />

        <header className={`fixed inset-x-0 top-0 z-50 w-full border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ${scrolled ? 'border-[#15803D]/10 bg-snow/80 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-[14px] dark:border-white/10 dark:bg-[#12201A]/80' : 'border-transparent bg-transparent'}`}>
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-6 lg:px-10">
            <button type="button" onClick={() => go('home')} aria-label="VoltShare home" className={`flex items-center gap-2.5 rounded-xl ${focus}`}>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#15803D] text-snow shadow-md"><Zap className="h-5 w-5" aria-hidden="true" /></span>
              <span className="font-display text-2xl font-semibold tracking-tight">VoltShare</span>
            </button>
            <nav aria-label="Host navigation" className="hidden items-center gap-1 md:flex">
              {TABS.map((t) => (<button key={t.id} type="button" aria-current={tab === t.id ? 'page' : undefined} onClick={() => go(t.id)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${tab === t.id ? 'text-[#15803D] dark:text-emerald-400' : muted} hover:text-[#15803D] ${focus}`}>{t.nav}</button>))}
            </nav>
            <div ref={menuRef} className="relative">
              <button type="button" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(!menu)} className={`flex items-center gap-2 rounded-full border border-[#15803D]/15 bg-snow/80 py-1.5 pl-1.5 pr-3 text-sm font-semibold shadow-sm transition hover:bg-snow dark:border-white/10 dark:bg-white/10 ${focus}`}>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-green-50 text-[#15803D]"><User className="h-4 w-4" aria-hidden="true" /></span>
                <span className="max-w-[8rem] truncate">{name}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${menu ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {menu && (
                <div role="menu" aria-label="Profile menu" className="absolute right-0 top-full z-50 mt-3 w-72 rounded-[20px] border border-[#15803D]/10 bg-[#FAF7F2]/95 p-2 backdrop-blur-[16px] shadow-[0_20px_40px_rgba(0,0,0,0.12)] dark:border-white/10 dark:bg-[#12201A]">
                  <div className="flex items-center gap-3 border-b border-[#15803D]/10 px-3 pb-3 pt-2 dark:border-white/10">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-[#15803D] text-snow"><User className="h-6 w-6" aria-hidden="true" /></span>
                    <div className="min-w-0"><p className="truncate font-semibold">{name}</p><p className={`text-sm ${muted}`}>Host</p></div>
                  </div>
                  <div className="py-1">
                    <button type="button" role="menuitem" onClick={() => go('settings')} className={item}><User className="h-4 w-4 text-[#15803D]" aria-hidden="true" />Profile</button>
                    <button type="button" role="menuitem" onClick={() => go('console')} className={item}><Plug className="h-4 w-4 text-[#15803D]" aria-hidden="true" />Host Workspace</button>
                    <button type="button" role="menuitem" onClick={() => go('history')} className={item}><HistoryIcon className="h-4 w-4 text-[#15803D]" aria-hidden="true" />History</button>
                    <div className="flex min-h-[44px] items-center gap-3 px-3 text-sm font-medium"><Sun className="h-4 w-4 text-[#15803D]" aria-hidden="true" />Theme
                      <div role="group" aria-label="Theme" className="ml-auto flex rounded-full bg-[#ECF4EE] p-0.5 text-xs font-semibold dark:bg-[#0C1713]">
                        {[['Light', false], ['Dark', true]].map(([l, v]) => (<button key={l} type="button" aria-pressed={dark === v} onClick={() => changeTheme(v ? 'dark' : 'light')} className={`rounded-full px-3 py-1.5 transition ${dark === v ? 'bg-[#15803D] text-snow shadow' : muted} ${focus}`}>{l}</button>))}
                      </div>
                    </div>
                  </div>
                  <button type="button" role="menuitem" onClick={logout} className={`${item} border-t border-[#15803D]/10 text-rose-600 hover:!bg-rose-50 dark:border-white/10 dark:text-rose-400 dark:hover:!bg-rose-500/10`}><LogOut className="h-4 w-4" aria-hidden="true" />Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="h-16 shrink-0" aria-hidden="true" />

        <main className="relative z-10">
          <nav aria-label="Host sections" className="mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto px-6 pb-1 pt-4 md:hidden">
            {TABS.map((t) => (<button key={t.id} type="button" aria-current={tab === t.id ? 'page' : undefined} onClick={() => go(t.id)} className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${tab === t.id ? 'bg-[#15803D] text-snow' : `bg-snow/80 dark:bg-white/10 ${muted}`} ${focus}`}><t.icon className="h-4 w-4" aria-hidden="true" />{t.nav}</button>))}
          </nav>
          <div key={tab} className="animate-fade-up">{pages[tab]}</div>
        </main>

        <footer className="relative z-10 border-t border-white/10 bg-zinc-950">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-10 sm:grid-cols-2 lg:grid-cols-3 lg:px-10">
            <div>
              <div className="flex items-center gap-2"><Zap className="h-5 w-5 text-[#15803D] dark:text-emerald-400" aria-hidden="true" /><span className="font-display text-lg font-semibold tracking-tight">VoltShare</span></div>
              <p className={`mt-3 max-w-xs text-sm ${muted}`}>Community EV charging and fair-price energy sharing between neighbours.</p>
            </div>
            <nav aria-label="Legal & Support">
              <h2 className="text-sm font-semibold">Legal & Support</h2>
              <ul className={`mt-3 space-y-2 text-sm ${muted}`}>
                <li><a href={ctx.footer?.privacyHref || '#'} onClick={(e) => { e.preventDefault(); ctx.footer?.onPrivacy?.(); }} className={`rounded hover:text-[#15803D] ${focus}`}>Privacy policy</a></li>
                <li><button type="button" onClick={() => go('support')} className={`rounded hover:text-[#15803D] ${focus}`}>Support form</button></li>
              </ul>
            </nav>
            <div>
              <h2 className="text-sm font-semibold">Contact</h2>
              <ul className={`mt-3 space-y-2 text-sm ${muted}`}>
                <li><a href={ctx.footer?.phoneHref} className={`inline-flex items-center gap-2 rounded hover:text-[#15803D] ${focus}`}><Phone className="h-4 w-4" aria-hidden="true" />{ctx.footer?.phoneDisplay}</a></li>
                <li><a href={`mailto:${ctx.footer?.email}`} className={`inline-flex items-center gap-2 break-all rounded hover:text-[#15803D] ${focus}`}><Mail className="h-4 w-4 shrink-0" aria-hidden="true" />{ctx.footer?.email}</a></li>
              </ul>
            </div>
          </div>
          <div><p className={`mx-auto w-full max-w-7xl px-6 py-5 text-xs lg:px-10 ${muted}`}>© {new Date().getFullYear()} VoltShare. All rights reserved.</p></div>
        </footer>
      </div>
    </div>
  );
}