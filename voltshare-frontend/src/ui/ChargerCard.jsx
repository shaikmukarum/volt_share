import { Loader2, Siren, MapPin, Zap, IndianRupee } from 'lucide-react';
import ChargerThumb from './ChargerThumb.jsx';
import { card, btnBase, btnPrimary, pill } from './tokens.js';
import { powerLabel, connectorLabel } from './format.js';

/* One frosted charger card. All behaviour comes in through props (App.jsx keeps the logic). */
export default function ChargerCard({ c, reqStatus, active, busy, loading, sosActive, onHover, onRequest }) {
  const sent = Boolean(reqStatus);
  const available = Boolean(c.is_available_now);

  return (
    <article
      id={`charger-${c.charger_id}`}
      onMouseEnter={() => onHover(c.charger_id)}
      onFocus={() => onHover(c.charger_id)}
      className={`${card} flex flex-col gap-4 p-4 sm:p-5 ${active ? 'border-emerald-500/50 ring-2 ring-emerald-500/25' : ''} ${sent ? 'border-emerald-500/25' : ''}`}
    >
      <div className="flex gap-4">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-zinc-950 sm:h-32 sm:w-32">
          <ChargerThumb id={c.charger_id} className="h-full w-full" />
          <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={pill}><MapPin className="h-3 w-3" aria-hidden="true" />{Number(c.distance_km).toFixed(2)} km</span>
            {reqStatus === 'APPROVED' && <span className="inline-flex rounded-full border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-[11px] font-semibold text-teal-300">Accepted</span>}
            {reqStatus === 'CHARGING_ACTIVE' && <span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">Charging here</span>}
          </div>
          <h3 className="mt-2.5 line-clamp-2 font-display text-lg font-semibold leading-snug tracking-tight text-zinc-100">{c.title}</h3>
          <p className="mt-1 truncate text-xs text-zinc-400">{c.area_name} · Host {c.host_name}</p>
          <p className={`mt-2 inline-flex items-center gap-1.5 text-xs font-medium ${available ? 'text-emerald-400' : 'text-amber-400'}`}>
            <span className={`h-2 w-2 rounded-full ${available ? 'bg-emerald-500' : 'bg-amber-500'}`} aria-hidden="true" />
            {available ? 'Available now' : 'Busy right now'}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 rounded-2xl border border-white/5 bg-zinc-950 p-3 text-xs">
        <div><dt className="flex items-center gap-1 text-zinc-500"><Zap className="h-3 w-3" aria-hidden="true" />Speed</dt><dd className="mt-0.5 font-semibold text-zinc-100">{powerLabel(c.power_kw, c.connector_type)}</dd></div>
        <div><dt className="text-zinc-500">Connector</dt><dd className="mt-0.5 font-semibold text-teal-300">{connectorLabel(c.connector_type)}</dd></div>
        <div><dt className="flex items-center gap-1 text-zinc-500"><IndianRupee className="h-3 w-3" aria-hidden="true" />Tariff</dt><dd className="mt-0.5 font-semibold text-emerald-400">₹{c.price_per_kwh} / kWh</dd></div>
      </dl>

      <button
        type="button"
        disabled={busy || sent}
        title={sosActive && !sent ? 'Sent as an SOS emergency request' : undefined}
        onClick={onRequest}
        className={sent ? `${btnBase} w-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 disabled:!opacity-100` : `${btnPrimary} w-full`}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {!sent && sosActive && !loading && <Siren className="h-4 w-4" aria-hidden="true" />}
        {sent ? 'Request Sent ✓' : 'Request Charger'}
      </button>
    </article>
  );
}
