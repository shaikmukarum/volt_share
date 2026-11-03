import { MapPin } from 'lucide-react';
import ChargerThumb from './ChargerThumb.jsx';
import { statusSolid } from './tokens.js';
import { fmtDateTime, powerLabel } from './format.js';

/* One horizontal frosted row per charging session */
export default function HistoryRows({ sessions }) {
  return (
    <ul className="space-y-3">
      {sessions.map((b) => {
        const done = b.status === 'COMPLETED';
        const when = done ? b.actual_end_time || b.created_at : b.created_at;
        const kwh = b.units_consumed_kwh != null ? `${Number(b.units_consumed_kwh).toFixed(2)} kWh` : done ? '—' : 'In progress';
        return (
          <li
            key={b.booking_id}
            className="vs-card grid items-center gap-x-5 gap-y-3 rounded-3xl border border-white/10 bg-zinc-900/60 p-3 backdrop-blur-xl transition-colors hover:border-emerald-500/30 sm:grid-cols-[auto_minmax(0,1.25fr)_auto_minmax(0,1.35fr)] sm:p-4"
          >
            <div className="flex items-center gap-4 sm:contents">
              <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-2xl bg-zinc-950 sm:h-[72px] sm:w-24">
                <ChargerThumb id={b.charger_id} className="h-full w-full" />
              </div>
              <div className="min-w-0 sm:col-start-2">
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-mono text-sm font-semibold text-emerald-400">#{b.booking_id}</span>
                  <span className="font-display text-lg font-semibold tracking-tight text-zinc-100">{fmtDateTime(when)}</span>
                </p>
                <p className="mt-0.5 text-sm text-zinc-400">{powerLabel(b.power_kw, b.connector_type)} <span aria-hidden="true">·</span> {kwh}</p>
                <p className="mt-0.5 truncate text-xs text-zinc-500">{b.title} · Host {b.host_name}</p>
              </div>
            </div>
            <span className={`inline-flex w-fit items-center justify-center rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider sm:col-start-3 ${statusSolid(b.status)}`}>
              {done ? 'Completed' : b.status === 'CHARGING_ACTIVE' ? 'Charging' : b.status}
            </span>
            <p className="flex items-start gap-2.5 text-sm font-medium text-zinc-200 sm:col-start-4">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-400"><MapPin className="h-3.5 w-3.5" aria-hidden="true" /></span>
              <span className="min-w-0 break-words">{b.unlocked_address}</span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
