import plugin from 'tailwindcss/plugin';
import colors from 'tailwindcss/colors';

/**
 * THEMING
 * The colour families the dashboard uses (zinc, emerald, teal, amber, rose, sky, white) are driven by
 * CSS variables, so every existing utility (bg-zinc-900, text-emerald-400, border-white/10 ...) works in
 * both themes without touching each class.
 *   - :root                     -> Tailwind's own default values  = the existing DARK theme (and the landing page)
 *   - [data-theme="light"]      -> the Cream-White & Forest Green LIGHT theme below
 * App.jsx sets data-theme on the dashboard wrapper only, so the landing page is never re-coloured.
 */
const FAMILIES = ['zinc', 'emerald', 'teal', 'amber', 'rose', 'sky'];
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

// Light-theme overrides; any shade not listed keeps Tailwind's default value.
const LIGHT = {
  // Neutrals: forest-charcoal text on cream/ivory surfaces, sage borders
  zinc: {
    50: '#0b1a11', 100: '#112218', 200: '#1c3427', 300: '#2f4538', 400: '#4a5d52', 500: '#62756a',
    600: '#7d8f84', 700: '#c9d9ce', 800: '#dce8df', 900: '#ffffff', 950: '#f7f4ed',
  },
  // Signature forest green (#15803d primary, #137333 text on mint)
  emerald: {
    50: '#f0faf3', 100: '#e6f4ea', 200: '#0f5f2b', 300: '#0f6a2f', 400: '#137333', 500: '#16a34a',
    600: '#15803d', 700: '#166534', 800: '#14532d', 900: '#dcefe2', 950: '#e8f5ec',
  },
  teal: { 200: '#115e59', 300: '#0f766e', 400: '#0d9488', 950: '#e3f5f2' },
  amber: { 200: '#92400e', 300: '#b45309', 400: '#d97706', 950: '#fef6e0' },
  rose: { 200: '#991b1b', 300: '#b91c1c', 400: '#dc2626', 600: '#dc2626', 950: '#fef2f2' },
  sky: { 200: '#075985', 300: '#0369a1', 500: '#0ea5e9', 950: '#e0f2fe' },
};
// "white" is used as a translucent overlay/border colour (border-white/10, bg-white/5): in light mode that
// overlay becomes a faint forest tint instead.
const WHITE = { dark: '255 255 255', light: '22 70 42' };

const channels = (hex) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' ');
};
const ref = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

const themed = Object.fromEntries(
  FAMILIES.map((f) => [f, Object.fromEntries(SHADES.map((s) => [s, ref(`${f}-${s}`)]))])
);

/** @type {import('tailwindcss').Config} */
export default {
  // The theme toggle sets data-theme on the app root, so Tailwind's dark: variant follows the same switch
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: { display: ['"Playfair Display"', 'Georgia', 'serif'] },
      keyframes: { fadeUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } } },
      animation: { 'fade-up': 'fadeUp .4s ease both' },
      colors: {
        ...themed,
        white: ref('white'),
        snow: '#ffffff', // always-white text for solid green buttons (stays white in both themes)
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      const dark = { '--c-white': WHITE.dark };
      const light = { '--c-white': WHITE.light };
      FAMILIES.forEach((f) =>
        SHADES.forEach((s) => {
          dark[`--c-${f}-${s}`] = channels(colors[f][s]);
          light[`--c-${f}-${s}`] = channels((LIGHT[f] && LIGHT[f][s]) || colors[f][s]);
        })
      );
      addBase({ ':root': dark, '[data-theme="light"]': light });
    }),
  ],
}