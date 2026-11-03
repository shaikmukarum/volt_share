/* Small presentation helpers (no app logic) */

export const connectorLabel = (t) =>
  ({ '15A_Socket': '15A Socket', Type2_Wallbox: 'Type 2 Wallbox', CCS2: 'CCS2 DC Fast' }[t] || t || '—');

export const currentType = (t) => (t === 'CCS2' ? 'DC' : 'AC');

// "7.2 kW AC"
export const powerLabel = (kw, type) => `${Number(kw) || 0} kW ${currentType(type)}`;

export const pad2 = (n) => String(Math.floor(n)).padStart(2, '0');

// 3725 -> "01:02:05"
export const clock = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${pad2(s / 3600)}:${pad2((s % 3600) / 60)}:${pad2(s % 60)}`;
};

// "29 Oct 2026, 06:47 pm" in the viewer's local time
export const fmtDateTime = (d) => {
  if (!d) return '—';
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return String(d);
  const date = t.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
  return `${date}, ${time}`;
};
