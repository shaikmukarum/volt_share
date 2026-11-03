const THUMBS = ['/images/charger-1.webp', '/images/charger-2.webp', '/images/charger-3.webp', '/images/charger-4.webp'];

/* Decorative charger photo (small WebP). The photo is picked from the charger id so a card always keeps its picture. */
export default function ChargerThumb({ id, className = '' }) {
  const src = THUMBS[Math.abs(Number(id) || 0) % THUMBS.length];
  return <img src={src} alt="" width="480" height="360" loading="lazy" decoding="async" className={`object-cover ${className}`} />;
}
