import { ArrowRight, Plug, Leaf, Users, ShieldCheck, IndianRupee, KeyRound, BatteryCharging } from 'lucide-react';
import { btnPill, card, eyebrow, focusRing } from './tokens.js';

const METRICS = [
  [Plug, '5K+', 'Charging Stations'],
  [Leaf, '1M+', 'CO₂ Saved'],
  [Users, '500K+', 'Happy EV Drivers']
];

const FEATURES = [
  [ShieldCheck, 'Private by default', 'Search shows only the area name. The full address unlocks once the host accepts your request.'],
  [IndianRupee, 'Capped, fair tariffs', 'Hosts pick a rate from ₹11 to ₹16 per kWh. No surge pricing and a clear bill after each session.'],
  [KeyRound, 'One PIN, any host', 'Send requests to several hosts with a single 4-digit PIN, then drive to the closest one that accepts.'],
  [BatteryCharging, 'Every connector', '15A wall sockets for 2W and 3W, 7.2 kW Type-2 AC wallboxes and CCS2 DC fast chargers.']
];

/* Home tab for signed-in members (the public landing page for visitors is Landing.jsx) */
export default function MemberHome({ cta, onPrimary, onAbout }) {
  return (
    <div className="space-y-16 sm:space-y-20">
      <section aria-labelledby="home-title" className="relative isolate">
        <div className="flex min-h-[560px] flex-col justify-between gap-12 p-6 sm:min-h-[620px] sm:p-10 lg:p-14">
          <div className="max-w-xl pt-4 sm:pt-8">
            <p className={eyebrow}>Drive green · Charge smart</p>
            <h1 id="home-title" className="mt-4 font-display text-5xl font-semibold leading-[1.02] tracking-tight text-zinc-100 sm:text-6xl lg:text-7xl">
              Drive Green.<br />Live Better.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-zinc-300 sm:text-lg">
              Power your journey with neighbours' idle home chargers. Locate, charge and go, with fair prices and private addresses.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button type="button" onClick={onPrimary} className={btnPill}>{cta} <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
              <button type="button" onClick={onAbout} className={`inline-flex min-h-[48px] items-center rounded-full border border-white/10 bg-zinc-900/60 px-6 text-sm font-medium text-zinc-200 backdrop-blur-xl transition-colors hover:bg-zinc-900 ${focusRing}`}>How it works</button>
            </div>
          </div>

          <ul className="grid gap-3 sm:grid-cols-3 sm:gap-4" aria-label="VoltShare at a glance">
            {METRICS.map(([Icon, value, label]) => (
              <li key={label} className="vs-card flex items-center gap-4 rounded-3xl border border-white/10 bg-zinc-900/70 p-4 backdrop-blur-xl sm:p-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                <div>
                  <p className="font-display text-3xl font-semibold leading-none text-zinc-100">{value}</p>
                  <p className="mt-1 text-sm text-zinc-400">{label}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="why-title">
        <p className={eyebrow}>Why VoltShare</p>
        <h2 id="why-title" className="mt-2 font-display text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">Built for neighbourhood charging</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(([Icon, title, text]) => (
            <article key={title} className={`${card} p-6`}>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <h3 className="mt-5 font-display text-xl font-semibold text-zinc-100">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}