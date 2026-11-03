/* Shared design tokens (class strings). The colour names are theme-aware: see tailwind.config.js. */

export const wrap = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8';

// Frosted surface: crisp white in light mode, translucent dark glass in dark mode
export const card =
  'vs-card rounded-3xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl transition-colors hover:border-emerald-500/30';

export const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500';

export const btnBase = `inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
export const btnPrimary = `${btnBase} vs-btn-primary bg-emerald-600 text-snow shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-400/20 hover:bg-emerald-500`;
export const btnGhost = `${btnBase} border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10`;
export const btnDanger = `${btnBase} vs-danger border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20`;
// Rounded "pill" call-to-action used on the hero and the live monitor
export const btnPill = `${btnBase} vs-btn-primary min-h-[48px] !rounded-full bg-emerald-600 px-7 text-snow shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-400/20 hover:bg-emerald-500`;

export const inputCls = `w-full min-h-[44px] rounded-lg border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus-visible:border-emerald-500/50 focus-visible:ring-2 focus-visible:ring-emerald-500`;
export const labelCls = 'mb-1.5 block text-xs font-medium text-zinc-400';
export const menuItem = `flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-zinc-100 ${focusRing}`;
export const pill = 'vs-mint inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400';
export const eyebrow = 'text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-400';
export const h1Cls = 'font-display text-4xl font-semibold leading-[1.05] tracking-tight text-zinc-100 sm:text-5xl';
export const h2Cls = 'font-display text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl';

export const statusCls = (s) =>
  s === 'COMPLETED'
    ? 'vs-mint border-sky-500/20 bg-sky-500/10 text-sky-300'
    : s === 'CHARGING_ACTIVE'
    ? 'animate-pulse border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
    : s === 'APPROVED'
    ? 'border-teal-500/20 bg-teal-500/10 text-teal-300'
    : s === 'CANCELLED'
    ? 'border-zinc-500/20 bg-zinc-500/10 text-zinc-400'
    : 'border-amber-500/20 bg-amber-500/10 text-amber-300';

// Solid pill used on History rows: forest green = completed, slate = cancelled
export const statusSolid = (s) =>
  s === 'COMPLETED'
    ? 'bg-emerald-600 text-snow'
    : s === 'CHARGING_ACTIVE'
    ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30 motion-safe:animate-pulse'
    : 'bg-zinc-500 text-snow';

export const statusLabel = (s, who = 'driver') =>
  ({
    REQUESTED: who === 'host' ? 'New request' : 'Waiting for host',
    APPROVED: 'Accepted',
    CHARGING_ACTIVE: 'Charging',
    COMPLETED: 'Completed'
  }[s] || s);
