import { useEffect, useState } from 'react';
import { ArrowLeft, Zap, IndianRupee, Plug, Clock, MapPin, Phone, Square, Home } from 'lucide-react';
import { btnPill, btnGhost, btnBase, focusRing, eyebrow } from './tokens.js';
import { clock, connectorLabel, powerLabel } from './format.js';

const RADIUS = 118;
const CIRC = 2 * Math.PI * RADIUS;

/**
 * Live Charging Monitor for the driver's CHARGING_ACTIVE booking.
 *
 * The backend does not stream meter data: the HOST types the real kWh when the session ends and that
 * reading sets the final bill. So everything shown here is derived from facts the app really has
 * (when the session started, the charger's rated kW, the tariff) and the energy / cost are labelled
 * as ESTIMATES. Nothing is invented.
 */
export default function LiveSession({ booking, onBack }) {
  const [now, setNow] = useState(() => Date.now());
  const [stopOpen, setStopOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const startedAt = new Date(booking.slot_start || booking.created_at).getTime();
  const slotEnd = new Date(booking.slot_end).getTime();
  const slotSeconds = Number.isFinite(slotEnd) && slotEnd > startedAt ? (slotEnd - startedAt) / 1000 : 3600;

  const elapsed = Number.isFinite(startedAt) ? Math.max(0, (now - startedAt) / 1000) : 0;
  const progress = Math.min(1, elapsed / slotSeconds);
  const remainingMin = Math.max(0, Math.ceil((slotSeconds - elapsed) / 60));

  const powerKw = Number(booking.power_kw) || 0;
  const rate = Number(booking.price_per_kwh) || 0;
  const estKwh = (powerKw * elapsed) / 3600;
  const estCost = estKwh * rate;

  const phone = String(booking.host_phone || '').replace(/\s+/g, '');
  const stat = 'vs-card flex items-center gap-4 rounded-3xl border border-white/10 bg-zinc-900/70 p-5 backdrop-blur-xl lg:flex-col lg:justify-center lg:text-center';

  return (
    <section aria-labelledby="live-title" className="relative isolate">

      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={onBack} className={`inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:text-zinc-100 ${focusRing}`}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
          </button>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 motion-safe:animate-ping" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
            Charging in progress
          </span>
        </div>

        <div className="mt-5 text-center lg:text-left">
          <p className={eyebrow}>Live charging monitor</p>
          <h2 id="live-title" className="mt-2 font-display text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">{booking.title}</h2>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-zinc-400 lg:justify-start"><MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{booking.unlocked_address}</p>
        </div>

        <div className="mt-8 grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,auto)_minmax(0,1fr)]">
          <div className={`${stat} lg:order-1`}>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-400"><Zap className="h-6 w-6" aria-hidden="true" /></span>
            <div>
              <p className="text-sm text-zinc-400">Power</p>
              <p className="font-display text-2xl font-semibold text-zinc-100">{powerKw} kW</p>
              <p className="text-[11px] text-zinc-500">{connectorLabel(booking.connector_type)}</p>
            </div>
          </div>

          {/* gauge */}
          <div className="relative mx-auto h-[290px] w-[290px] sm:h-[330px] sm:w-[330px] lg:order-2" role="img" aria-label={`Estimated ${estKwh.toFixed(1)} kilowatt hours delivered, ${remainingMin} minutes remaining in the booked slot`}>
            <svg viewBox="0 0 280 280" className="h-full w-full -rotate-90 drop-shadow-[0_0_18px_rgba(22,163,74,0.30)]" aria-hidden="true">
              <defs>
                <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" style={{ stopColor: 'rgb(var(--c-emerald-400))' }} />
                  <stop offset="100%" style={{ stopColor: 'rgb(var(--c-emerald-600))' }} />
                </linearGradient>
              </defs>
              <circle cx="140" cy="140" r={RADIUS} fill="none" strokeWidth="14" className="stroke-emerald-500/15" />
              <circle
                cx="140" cy="140" r={RADIUS} fill="none" strokeWidth="14" strokeLinecap="round"
                stroke="url(#gauge-grad)" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - Math.max(0.02, progress))}
                className="transition-[stroke-dashoffset] duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
              <p className="font-display text-4xl font-semibold leading-none text-zinc-100 sm:text-5xl">{estKwh.toFixed(1)} <span className="text-2xl sm:text-3xl">kWh</span></p>
              <p className="mt-1 text-sm font-medium text-zinc-400">Delivered <span className="text-zinc-500">(estimated)</span></p>
              <div className="my-3 h-px w-24 bg-white/10" />
              <p className="font-display text-xl font-semibold text-zinc-100">{powerKw} kW</p>
              <p className="text-xs text-zinc-400">Charging speed (rated)</p>
              <div className="my-3 h-px w-24 bg-white/10" />
              <p className="font-display text-xl font-semibold text-zinc-100">{remainingMin} min</p>
              <p className="text-xs text-zinc-400">Left in your slot</p>
            </div>
          </div>

          <div className={`${stat} lg:order-3`}>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-400"><IndianRupee className="h-6 w-6" aria-hidden="true" /></span>
            <div>
              <p className="text-sm text-zinc-400">Cost so far</p>
              <p className="font-display text-2xl font-semibold text-zinc-100">₹ {estCost.toFixed(2)}</p>
              <p className="text-[11px] text-zinc-500">₹{booking.price_per_kwh} / kWh · estimate</p>
            </div>
          </div>
        </div>

        {/* details strip */}
        <dl className="vs-card mx-auto mt-8 grid max-w-3xl gap-4 rounded-3xl border border-white/10 bg-zinc-900/70 p-4 backdrop-blur-xl sm:grid-cols-3 sm:p-5">
          <div className="flex items-center gap-3"><Home className="h-6 w-6 shrink-0 text-emerald-400" aria-hidden="true" /><div className="min-w-0"><dt className="text-xs text-zinc-500">Host</dt><dd className="truncate text-sm font-semibold text-zinc-100">{booking.host_name}</dd></div></div>
          <div className="flex items-center gap-3"><Plug className="h-6 w-6 shrink-0 text-emerald-400" aria-hidden="true" /><div className="min-w-0"><dt className="text-xs text-zinc-500">Connector</dt><dd className="truncate text-sm font-semibold text-zinc-100">{powerLabel(booking.power_kw, booking.connector_type)}</dd></div></div>
          <div className="flex items-center gap-3"><Clock className="h-6 w-6 shrink-0 text-emerald-400" aria-hidden="true" /><div><dt className="text-xs text-zinc-500">Session time</dt><dd className="font-mono text-sm font-semibold tabular-nums text-zinc-100" aria-live="off">{clock(elapsed)}</dd></div></div>
        </dl>

        <p className="mx-auto mt-4 max-w-2xl text-center text-xs leading-relaxed text-zinc-500">
          Energy and cost are estimated from your charger's rated power and the time elapsed. Your host reads the meter when you finish, and that exact kWh sets your final bill.
        </p>

        <div className="mt-6 flex justify-center">
          <button type="button" aria-expanded={stopOpen} aria-controls="stop-help" onClick={() => setStopOpen((v) => !v)} className={btnPill}>
            <Square className="h-4 w-4 fill-current" aria-hidden="true" /> Stop Session
          </button>
        </div>

        {stopOpen && (
          <div id="stop-help" className="vs-card mx-auto mt-5 max-w-xl rounded-3xl border border-emerald-500/25 bg-zinc-900/80 p-5 text-center backdrop-blur-xl">
            <h3 className="font-display text-lg font-semibold text-zinc-100">Ready to finish charging?</h3>
            <p className="mt-1.5 text-sm text-zinc-400">Your host ends the session by entering the kWh from the charger's meter, which also generates your bill. Unplug when you are done and let them know.</p>
            <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
              {phone && !phone.includes('🔒') && (
                <a href={`tel:${phone}`} className={`${btnBase} vs-btn-primary bg-emerald-600 text-snow hover:bg-emerald-500`}><Phone className="h-4 w-4" aria-hidden="true" /> Call {booking.host_name}</a>
              )}
              <button type="button" onClick={() => setStopOpen(false)} className={btnGhost}>Keep charging</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}