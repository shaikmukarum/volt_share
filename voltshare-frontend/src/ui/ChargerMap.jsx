import { useEffect, useRef, useState } from 'react';
import { Search, SlidersHorizontal, ChevronDown, X, Plus, Minus, LocateFixed, Zap } from 'lucide-react';
import { focusRing } from './tokens.js';

/* ------------------------------------------------------------------ */
/* Stylised street map. No map tiles or API keys: the streets are       */
/* decorative art, while the pins are placed from each charger's REAL   */
/* latitude/longitude relative to the driver, so distances are true to  */
/* scale (the dashed rings show 1 km, 2 km ... steps).                  */
/* ------------------------------------------------------------------ */

const KM_PER_DEG_LAT = 110.574;
const ZOOM_MIN = 0.6;
const ZOOM_MAX = 2.6;

const MAJOR = [
  'M-20 300 C 200 260, 360 330, 540 250 S 860 140, 1020 170',
  'M120 -20 C 170 120, 130 270, 230 440',
  'M650 -20 C 590 120, 690 270, 610 440',
  'M-20 90 C 220 130, 420 60, 700 112 S 900 80, 1020 58',
  'M390 -20 C 410 100, 320 210, 410 440'
];
const MINOR = [
  'M-10 200 L1010 188', 'M-10 365 L1010 340', 'M262 -10 L250 430', 'M515 -10 L525 430',
  'M790 -10 L805 430', 'M905 -10 L870 430', 'M50 -10 L38 430', 'M-10 20 L1010 40'
];
const PARKS = [
  'M300 118 q40 -34 92 -10 q42 28 8 64 q-52 26 -102 -6 z',
  'M720 262 q52 -38 112 -4 q32 42 -10 72 q-72 20 -102 -22 z',
  'M40 322 q40 -32 92 0 q22 42 -30 62 q-62 -10 -62 -62 z',
  'M860 40 q34 -22 70 0 q18 30 -14 48 q-44 4 -56 -48 z'
];

function MapArt() {
  return (
    <svg viewBox="0 0 1000 420" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <rect width="1000" height="420" className="fill-zinc-950" />
      {PARKS.map((d) => <path key={d} d={d} className="fill-emerald-500/15" />)}
      <path d="M-20 392 C 200 346, 300 420, 520 388 S 800 334, 1020 388" className="fill-none stroke-sky-500/20" strokeWidth="30" strokeLinecap="round" />
      <g className="fill-none stroke-zinc-700" strokeLinecap="round">
        {MAJOR.map((d) => <path key={d} d={d} strokeWidth="15" />)}
        {MINOR.map((d) => <path key={d} d={d} strokeWidth="7" />)}
      </g>
      <g className="fill-none stroke-zinc-900" strokeLinecap="round">
        {MAJOR.map((d) => <path key={d} d={d} strokeWidth="11" />)}
        {MINOR.map((d) => <path key={d} d={d} strokeWidth="4" />)}
      </g>
    </svg>
  );
}

export default function ChargerMap({
  chargers,
  total,
  origin,
  radiusKm,
  activeId,
  onHover,
  onSelect,
  query,
  onQuery,
  filtersOpen,
  onToggleFilters,
  filtersPanel,
  extra
}) {
  const boxRef = useRef(null);
  const [box, setBox] = useState({ w: 1000, h: 420 });
  const [zoom, setZoom] = useState(1);

  // Track the rendered size so pin positions stay true to scale on every screen
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width && height) setBox({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const kmPerDegLng = 111.32 * Math.cos((origin.lat * Math.PI) / 180);
  const farthest = chargers.reduce((m, c) => Math.max(m, Number(c.distance_km) || 0), 0);
  const reachKm = Math.max(0.6, Math.min(Number(radiusKm) || 5, farthest || Number(radiusKm) || 5));
  const pxPerKm = ((Math.min(box.w, box.h) / 2) * 0.74 * zoom) / reachKm;

  const place = (c) => {
    const dx = (Number(c.longitude) - origin.lng) * kmPerDegLng;
    const dy = (Number(c.latitude) - origin.lat) * KM_PER_DEG_LAT;
    const x = box.w / 2 + dx * pxPerKm;
    const y = box.h / 2 - dy * pxPerKm;
    return { x: Math.min(box.w - 28, Math.max(28, x)), y: Math.min(box.h - 22, Math.max(64, y)) };
  };

  // Dashed distance rings: spacing adapts to the radius so the map never gets cluttered
  const step = reachKm <= 1.5 ? 0.5 : reachKm <= 3 ? 1 : reachKm <= 6 ? 2 : 5;
  const rings = [];
  for (let k = step; k * pxPerKm < Math.max(box.w, box.h) * 0.62 && rings.length < 5; k += step) rings.push(k);

  const active = chargers.find((c) => c.charger_id === activeId);
  const zoomBtn = `grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-zinc-900/85 text-zinc-200 shadow-md backdrop-blur-xl transition-colors hover:bg-zinc-900 disabled:opacity-40 ${focusRing}`;

  return (
    <div className="vs-card relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900/60 p-0 backdrop-blur-xl">
      <div
        ref={boxRef}
        role="region"
        aria-label="Charger map"
        className="relative h-[360px] w-full overflow-hidden sm:h-[420px] lg:h-[460px]"
      >
        <MapArt />

        {/* distance rings around "you" */}
        {rings.map((k) => (
          <div
            key={k}
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-emerald-500/30"
            style={{ width: k * pxPerKm * 2, height: k * pxPerKm * 2 }}
            aria-hidden="true"
          >
            <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-900/80 px-1.5 text-[10px] font-medium text-zinc-400 backdrop-blur">{+k.toFixed(1)} km</span>
          </div>
        ))}

        {/* you are here */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
          <span className="absolute inset-0 -m-3 rounded-full bg-emerald-500/20 motion-safe:animate-ping" />
          <span className="relative block h-3.5 w-3.5 rounded-full border-2 border-snow bg-emerald-600 shadow-lg" />
        </div>

        {/* charger pins */}
        {chargers.map((c) => {
          const { x, y } = place(c);
          const isActive = c.charger_id === activeId;
          const available = Boolean(c.is_available_now);
          return (
            <button
              key={c.charger_id}
              type="button"
              onMouseEnter={() => onHover(c.charger_id)}
              onFocus={() => onHover(c.charger_id)}
              onClick={() => onSelect(c.charger_id)}
              aria-label={`${c.area_name}, ${Number(c.distance_km).toFixed(2)} kilometres, ${available ? 'available' : 'busy'}. Show in list`}
              className={`absolute -translate-x-1/2 -translate-y-full transition-transform duration-200 ${isActive ? 'z-20 scale-110' : 'z-10 hover:scale-105'} rounded-full ${focusRing}`}
              style={{ left: x, top: y + 6 }}
            >
              <span
                className={`block h-9 w-9 rotate-45 rounded-full rounded-br-none border-2 border-snow shadow-lg ${
                  available ? 'bg-emerald-600' : 'bg-zinc-500'
                } ${isActive ? 'ring-4 ring-emerald-500/30' : ''}`}
              >
                <span className="grid h-full w-full -rotate-45 place-items-center text-snow">
                  <Zap className="h-4 w-4 fill-current" aria-hidden="true" />
                </span>
              </span>
            </button>
          );
        })}

        {/* floating label for the highlighted pin */}
        {active && (() => {
          const { x, y } = place(active);
          const below = y < 140; // near the top edge: show the label under the pin instead of above it
          return (
            <div
              className={`pointer-events-none absolute z-30 -translate-x-1/2 whitespace-nowrap rounded-2xl border border-white/10 bg-zinc-900/90 px-3.5 py-2 text-left shadow-xl backdrop-blur-xl ${below ? '' : '-translate-y-full'}`}
              style={{ left: Math.min(box.w - 80, Math.max(80, x)), top: below ? y + 14 : y - 38 }}
              role="status"
            >
              <span className="block text-sm font-semibold text-zinc-100">{active.area_name}</span>
              <span className="block text-xs font-medium text-emerald-400">{Number(active.distance_km).toFixed(2)} km</span>
            </div>
          );
        })()}

        {/* search + filters */}
        <div className="absolute left-3 top-3 z-30 w-[calc(100%-4.75rem)] max-w-[28rem] sm:left-4 sm:top-4">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/85 py-1.5 pl-4 pr-1.5 shadow-lg backdrop-blur-xl">
            <Search className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search for chargers near you..."
              aria-label="Search for chargers near you"
              className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button type="button" aria-label="Clear search" onClick={() => onQuery('')} className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-zinc-100 ${focusRing}`}>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              aria-expanded={filtersOpen}
              aria-controls="finder-filters"
              onClick={onToggleFilters}
              className={`flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10 ${focusRing}`}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Filters</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          </div>
          {filtersOpen && (
            <div id="finder-filters" className="mt-2 rounded-3xl border border-white/10 bg-zinc-900/90 p-4 shadow-xl backdrop-blur-xl">
              {filtersPanel}
            </div>
          )}
        </div>

        {/* zoom controls */}
        <div className="absolute right-3 top-3 z-30 flex flex-col gap-2 sm:right-4 sm:top-4">
          <button type="button" aria-label="Zoom in" disabled={zoom >= ZOOM_MAX} onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z * 1.3).toFixed(2)))} className={zoomBtn}><Plus className="h-4 w-4" aria-hidden="true" /></button>
          <button type="button" aria-label="Zoom out" disabled={zoom <= ZOOM_MIN} onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z / 1.3).toFixed(2)))} className={zoomBtn}><Minus className="h-4 w-4" aria-hidden="true" /></button>
          <button type="button" aria-label="Reset map view" onClick={() => setZoom(1)} className={zoomBtn}><LocateFixed className="h-4 w-4" aria-hidden="true" /></button>
        </div>

        {/* result count */}
        <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-2 sm:bottom-4 sm:left-4">
          <span className="rounded-full border border-white/10 bg-zinc-900/85 px-3.5 py-1.5 text-xs font-medium text-zinc-300 shadow-md backdrop-blur-xl">
            {chargers.length === total ? `${total} charger${total === 1 ? '' : 's'}` : `${chargers.length} of ${total} chargers`} within {radiusKm} km
          </span>
          {extra}
        </div>
      </div>
    </div>
  );
}
