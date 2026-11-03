import React, { useEffect, useRef, useState } from 'react';
import { Zap, Leaf, Users, Cloud, ArrowRight, ArrowDown, MapPin, Phone, Mail, Send, Menu, X, Loader2, Check } from 'lucide-react';

/* ---- Content (edit here) ---- */
const BRAND = {
  phone: '+91 98765 43210',
  phoneHref: 'tel:+919876543210',
  email: 'hello@voltshare.com',
  address: 'Nellore, Andhra Pradesh, India - 524001'
};
const STATS = [
  { icon: Users, value: 30000, suffix: '+', label: 'Community Members' },
  { icon: Leaf, value: 500, suffix: '+', label: 'Active Hosts' },
  { icon: Cloud, value: 120, suffix: '+ tons', label: 'Carbon Emissions Saved' }
];
const NAV = [['home', 'Home'], ['about', 'About'], ['how', 'How It Works'], ['contact', 'Contact']];
const STEPS = [
  ['01', 'Find a Charger Nearby', 'Search available home chargers within 500m–2km. Filter by connector type: 15A Socket, Type-2 or CCS2.'],
  ['02', 'Request & Connect', 'Choose a charger, check compatibility and send a booking request. The host unlocks the exact address on approval, with a 4-digit OTP.'],
  ['03', 'Charge Safely', 'Reach the location, verify with the 4-digit OTP, and track your live charging session in real time.'],
  ['04', 'Pay & Go', 'Tariffs are calculated automatically inside the ₹11–₹16/kWh fair-price guardrail. Get an itemized receipt.']
];

/* ---- Style tokens ---- */
const cardCls = 'rounded-3xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)]';
const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F2]';
const btnGreen = `inline-flex items-center justify-center gap-2 rounded-full bg-[#15803D] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-green-900/15 transition duration-200 hover:-translate-y-0.5 hover:bg-[#166534] hover:shadow-xl active:translate-y-0 ${ring}`;
const btnOutline = `inline-flex items-center justify-center gap-2 rounded-full border border-slate-900/15 bg-white/60 px-5 py-2.5 text-sm font-semibold text-[#0F172A] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:bg-white ${ring}`;
const tagCls = 'text-xs font-bold uppercase tracking-[0.22em] text-[#15803D]';
const h2Cls = 'font-display text-4xl font-semibold leading-[1.05] tracking-tight text-[#0F172A] sm:text-5xl lg:text-[3.5rem]';
const inputCls = 'w-full rounded-xl border border-slate-200 bg-[#FAF7F2] px-4 py-3 text-sm text-[#0F172A] placeholder:text-slate-400 outline-none transition focus:border-[#16A34A] focus:bg-white focus:ring-2 focus:ring-[#16A34A]/20';
const wrapCls = 'mx-auto w-full max-w-7xl px-5 sm:px-8';

/* Each section ends on the exact colour the next one starts with, so scrolling never shows a hard edge:
   hero fade -> About -> How It Works -> Contact -> footer fade */
const C = { heroEnd: '#f4f7f4', aboutEnd: '#f8f7f2', howEnd: '#f3f2ea', contactEnd: '#f6f5ee' };
const ABOUT_BG = {
  backgroundColor: C.heroEnd,
  backgroundImage: [
    'radial-gradient(55% 45% at 16% 52%, rgba(52,211,153,0.16), transparent 70%)',   // mint glow behind the photo collage
    'radial-gradient(42% 40% at 88% 78%, rgba(16,185,129,0.12), transparent 70%)',   // emerald glow behind the stat cards
    'radial-gradient(50% 35% at 60% 6%, #eef5f0, transparent 75%)',                   // sage mist
    `linear-gradient(180deg, ${C.heroEnd} 0%, #eef5f0 42%, ${C.aboutEnd} 100%)`
  ].join(',')
};
const HOW_BG = {
  backgroundColor: C.aboutEnd,
  backgroundImage: [
    'radial-gradient(50% 40% at 86% 24%, rgba(167,205,181,0.45), transparent 70%)',   // eucalyptus
    'radial-gradient(45% 40% at 8% 76%, rgba(200,225,208,0.5), transparent 70%)',
    `linear-gradient(180deg, ${C.aboutEnd} 0%, #e4eee7 32%, #d9e8de 52%, #e6eee3 76%, ${C.howEnd} 100%)`
  ].join(',')
};
const CONTACT_BG = {
  backgroundColor: C.howEnd,
  backgroundImage: [
    'radial-gradient(38% 46% at 76% 52%, rgba(22,163,74,0.13), transparent 70%)',     // ambient glow behind the form card
    'radial-gradient(34% 30% at 10% 18%, rgba(255,255,255,0.55), transparent 70%)',
    `linear-gradient(180deg, ${C.howEnd} 0%, #eff1e6 38%, #eceee2 70%, ${C.contactEnd} 100%)`
  ].join(',')
};
const FADE_MASK = { WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 22%, #000 78%, transparent)', maskImage: 'linear-gradient(to bottom, transparent, #000 22%, #000 78%, transparent)' };

const goTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/* ---- Small pieces ---- */
function CountUp({ value, suffix }) {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(value); return undefined; }
    let raf;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / 1400, 1);
        setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value]);
  return <span ref={ref}>{n.toLocaleString('en-IN')}{suffix}</span>;
}

const SOCIALS = [
  ['X', 'https://x.com', <><path d="M4 4l11.7 16H20L8.3 4H4z" /><path d="M4 20l6.8-6.8M13.2 10.8L20 4" /></>],
  ['Instagram', 'https://instagram.com', <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.7" fill="currentColor" /></>],
  ['LinkedIn', 'https://linkedin.com', <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 11v5M8 8v.01M12 16v-5M12 13c0-1.6 1-2 2-2s2 .8 2 2.2V16" /></>],
  ['YouTube', 'https://youtube.com', <><rect x="2.5" y="5" width="19" height="14" rx="4" /><path d="M10 9l5 3-5 3z" fill="currentColor" /></>]
];

const LOGO_MODE = {
  pill: '-ml-3 rounded-full border border-white/60 bg-[rgba(250,247,242,0.88)] px-3 py-2 shadow-[0_4px_15px_rgba(0,0,0,0.06)] backdrop-blur-[10px] sm:-ml-[18px] sm:px-[18px]',
  flat: '-ml-3 rounded-full border border-transparent bg-transparent px-3 py-2 sm:-ml-[18px] sm:px-[18px]'
};

function Logo({ onClick, light = false, mode }) {
  return (
    <button type="button" onClick={onClick} aria-label="VoltShare home" className={`flex items-center gap-2.5 ${mode ? `transition-all duration-300 ease-in-out ${LOGO_MODE[mode]}` : 'rounded-xl'} ${ring}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#15803D] text-white shadow-md shadow-green-900/20"><Zap className="h-5 w-5" aria-hidden="true" /></span>
      <span className="text-left leading-none">
        <span className={`block font-display text-2xl font-semibold tracking-tight ${light ? 'text-white' : 'text-[#0F172A]'}`}>VoltShare</span>
        <span className={`mt-1 hidden text-[9px] font-medium uppercase tracking-[0.2em] lg:block ${light ? 'text-white/70' : 'text-slate-500'}`}>People · Power · A cleaner tomorrow</span>
      </span>
    </button>
  );
}

function Header({ active, onLogin, onSignup }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 20);
    f();
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  const nav = (id) => { setOpen(false); goTo(id); };
  return (
    <header className={`fixed inset-x-0 top-0 z-40 border-b transition-all duration-300 ease-in-out ${scrolled ? 'border-white/20 bg-white/75 shadow-sm backdrop-blur-md' : open ? 'border-white/20 bg-white/90 backdrop-blur-md' : 'border-transparent bg-transparent shadow-none backdrop-blur-none [text-shadow:0_1px_10px_rgba(255,255,255,0.55)]'}`}>
      <div className={`${wrapCls} flex h-16 items-center justify-between gap-4`}>
        <Logo onClick={() => nav('home')} mode={scrolled || open ? 'flat' : 'pill'} />
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV.map(([id, label]) => (
            <button key={id} type="button" aria-current={active === id ? 'true' : undefined} onClick={() => nav(id)} className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${ring} ${active === id ? 'text-[#0F172A]' : 'text-slate-600 hover:text-[#0F172A]'}`}>
              {label}
              <span className={`absolute inset-x-0 -bottom-0.5 mx-auto h-1 w-1 rounded-full bg-[#15803D] transition-opacity ${active === id ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <button type="button" onClick={onLogin} className={btnOutline}>Log In</button>
          <button type="button" onClick={onSignup} className={`${btnGreen} !px-5 !py-2.5`}>Sign Up</button>
        </div>
        <button type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)} className={`grid h-11 w-11 place-items-center rounded-full border border-slate-900/10 bg-white/70 md:hidden ${ring}`}>
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-black/5 px-5 pb-5 pt-3 md:hidden">
          <nav aria-label="Mobile" className="grid gap-1">
            {NAV.map(([id, label]) => (
              <button key={id} type="button" onClick={() => nav(id)} className={`rounded-xl px-3 py-3 text-left text-base font-medium ${ring} ${active === id ? 'bg-green-50 text-[#15803D]' : 'text-slate-700'}`}>{label}</button>
            ))}
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => { setOpen(false); onLogin(); }} className={btnOutline}>Log In</button>
            <button type="button" onClick={() => { setOpen(false); onSignup(); }} className={btnGreen}>Sign Up</button>
          </div>
        </div>
      )}
    </header>
  );
}

/* ---- Sections ---- */
function Hero({ onSignup }) {
  return (
    <section id="home" className="relative isolate min-h-[100svh] overflow-hidden bg-[#E9E6DF]">
      <img src="/images/hero-bg.webp" alt="Green electric car charging at a home wallbox beside a white wall" fetchpriority="high" className="absolute inset-0 -z-10 h-full w-full object-cover object-[38%_60%]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-20" style={{ backgroundImage: 'linear-gradient(to bottom, rgba(244,247,244,0) 0%, rgba(244,247,244,0.6) 55%, #f4f7f4 100%)' }} aria-hidden="true" />
      <div className={`${wrapCls} flex min-h-[100svh] flex-col pt-28 sm:pt-32 lg:pt-[21vh]`}>
        <div className="max-w-xl lg:ml-[24%] lg:-translate-y-12">
          <h1 className="font-display text-[3.4rem] font-semibold leading-[0.95] tracking-tight text-[#0F172A] sm:text-7xl lg:text-[5.5rem]">
            Charge Smart.<br />Share Local.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-slate-700 sm:text-lg">
            Designed for a cleaner tomorrow. Connecting EV drivers with idle home chargers in your neighborhood.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={onSignup} className={btnGreen}>Get Started <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
            <button type="button" onClick={() => goTo('how')} className={btnOutline}>See how it works</button>
          </div>
        </div>
      </div>
      <button type="button" aria-label="Scroll to About" onClick={() => goTo('about')} className={`absolute bottom-8 left-1/2 grid h-14 w-14 -translate-x-1/2 animate-bounce place-items-center rounded-full border border-[#15803D]/30 bg-white/80 text-[#15803D] shadow-lg backdrop-blur transition hover:bg-white ${ring}`}>
        <ArrowDown className="h-5 w-5" aria-hidden="true" />
      </button>
    </section>
  );
}

function About({ onHow }) {
  const pos = 'absolute overflow-hidden';
  return (
    <section id="about" className="relative scroll-mt-16 overflow-hidden py-24 lg:py-32" style={ABOUT_BG}>
      <Flow name="about" />
      <div className={`${wrapCls} relative grid items-center gap-16 lg:grid-cols-[1.05fr_1fr] lg:gap-20`}>
        <div className="relative mx-auto aspect-[781/749] w-full max-w-[600px]">
          <img src="/images/about-wallbox.webp" alt="Black wallbox on a white wall charging a green car" loading="lazy" className={`${pos} left-0 top-0 h-[81.6%] w-[49%] rounded-3xl object-cover shadow-[0_20px_50px_rgba(0,0,0,0.12)]`} />
          <img src="/images/about-road.webp" alt="Green electric car driving beside a mountain lake" loading="lazy" className={`${pos} left-[52%] top-[30.2%] h-[69.2%] w-[48%] rounded-3xl object-cover shadow-[0_20px_50px_rgba(0,0,0,0.12)]`} />
          <div className={`${cardCls} absolute left-[53%] top-[1.9%] flex h-[24.7%] w-[35%] flex-col justify-between p-3 sm:p-4`}>
            <div className="flex items-start justify-between">
              <p className="font-display text-xl font-semibold leading-none sm:text-3xl">30,000+</p>
              <Leaf className="h-4 w-4 text-[#16A34A]" aria-hidden="true" />
            </div>
            <p className="text-[10px] leading-snug text-slate-500 sm:text-xs">charging sessions enabled by our community.</p>
            <div className="flex -space-x-1.5" aria-hidden="true">
              {['from-amber-300 to-orange-400', 'from-sky-300 to-blue-400', 'from-rose-300 to-pink-400', 'from-lime-300 to-green-400'].map((g) => (
                <span key={g} className={`h-5 w-5 rounded-full border-2 border-white bg-gradient-to-br sm:h-6 sm:w-6 ${g}`}></span>
              ))}
              <span className="grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-[#15803D] text-[10px] text-white sm:h-6 sm:w-6">+</span>
            </div>
          </div>
          <div className={`${cardCls} absolute left-[8.5%] top-[84.2%] flex h-[15.9%] w-[41.5%] items-center justify-between gap-2 px-3 sm:px-4`}>
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 shrink-0 text-[#16A34A]" aria-hidden="true" />
              <div><p className="text-[10px] font-semibold sm:text-xs">Lower Emissions</p><p className="text-[9px] leading-tight text-slate-500 sm:text-[11px]">Cleaner cities for a brighter future.</p></div>
            </div>
            <svg viewBox="0 0 44 44" className="h-9 w-9 shrink-0 sm:h-11 sm:w-11" aria-hidden="true"><circle cx="22" cy="22" r="18" fill="none" stroke="#E2E8F0" strokeWidth="4" /><circle cx="22" cy="22" r="18" fill="none" stroke="#15803D" strokeWidth="4" strokeLinecap="round" strokeDasharray="85 113" transform="rotate(-90 22 22)" /><text x="22" y="25" textAnchor="middle" fontSize="8" fontWeight="700" fill="#0F172A">-CO₂</text></svg>
          </div>
        </div>

        <div>
          <p className={tagCls}>About us</p>
          <h2 className={`${h2Cls} mt-4`}>Driven by People. Powered by a Cleaner Tomorrow.</h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            At VoltShare, we believe a cleaner, greener future is possible when communities come together. We connect EV drivers with nearby homeowners who have idle chargers, making charging more accessible, affordable, and sustainable.
          </p>
          <ul className="mt-9 grid gap-4 sm:grid-cols-3">
            {STATS.map(({ icon: Icon, value, suffix, label }) => (
              <li key={label} className={`${cardCls} flex items-center gap-3 p-4 transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)]`}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-green-50 text-[#15803D]"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <span><span className="block text-lg font-bold leading-tight"><CountUp value={value} suffix={suffix} /></span><span className="block text-xs text-slate-500">{label}</span></span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={onHow} className={`${btnGreen} mt-9`}>Learn More About Us <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
        </div>
      </div>
    </section>
  );
}

function Step({ n, title, text, children }) {
  return (
    <article className={`${cardCls} flex flex-col p-4 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_18px_40px_rgba(0,0,0,0.09)]`}>
      <div className="relative h-44 overflow-hidden rounded-2xl">{children}</div>
      <span className="mt-5 font-display text-4xl leading-none text-slate-300">{n}</span>
      <h3 className="mt-2 font-display text-xl font-semibold text-[#0F172A]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
    </article>
  );
}

function Pill({ icon, title, sub, arrow }) {
  return (
    <div className="absolute inset-x-2 bottom-2 flex items-center gap-2.5 rounded-2xl bg-white/90 px-3 py-2 shadow-lg backdrop-blur">
      {icon && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-green-50 text-[#15803D]">{icon}</span>}
      <span className="min-w-0 flex-1 leading-tight"><span className="block truncate text-xs font-semibold text-[#0F172A]">{title}</span><span className="block truncate text-[11px] text-slate-500">{sub}</span></span>
      {arrow && <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#15803D] text-white"><ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>}
    </div>
  );
}

/* Curves are drawn in a 1000x1000 box stretched to the section, so the lines that leave the bottom of one section
   (x = 200 / 520 / 860 for About, 240 / 540 / 820 for How It Works) enter the next section at the same spot. */
const FLOW = {
  about: {
    paths: [
      'M-20 520 C 150 380, 330 700, 520 560 S 760 380, 860 620 S 860 860, 860 1000',
      'M-20 640 C 180 520, 300 860, 520 720 S 520 880, 520 1000',
      'M1020 300 C 840 180, 640 420, 440 300 S 200 520, 200 700 S 200 900, 200 1000'
    ],
    nodes: [[52, 56], [86, 62], [20, 70]]
  },
  how: {
    paths: [
      'M200 0 C 200 160, 120 260, 220 420 S 400 700, 300 860 S 240 930, 240 1000',
      'M520 0 C 520 140, 640 300, 600 460 S 480 700, 560 860 S 540 920, 540 1000',
      'M860 0 C 860 180, 760 300, 820 480 S 940 700, 840 860 S 820 930, 820 1000'
    ],
    nodes: [[22, 42], [60, 46], [82, 48]]
  },
  contact: {
    paths: [
      'M240 0 C 240 120, 340 220, 300 380 S 140 600, 240 760 S 300 880, 300 1000',
      'M540 0 C 540 140, 420 260, 460 420 S 640 640, 560 800 S 520 900, 520 1000',
      'M820 0 C 820 160, 940 300, 880 480 S 760 700, 860 880 S 860 940, 860 1000'
    ],
    nodes: [[30, 38], [88, 48], [56, 80]]
  }
};
const FADE_OUT = { WebkitMaskImage: 'linear-gradient(to bottom, #000 0, #000 70%, transparent 100%)', maskImage: 'linear-gradient(to bottom, #000 0, #000 70%, transparent 100%)' };

function Flow({ name, mask }) {
  const { paths, nodes } = FLOW[name];
  return (
    <div className="pointer-events-none absolute inset-0" style={mask} aria-hidden="true">
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <g fill="none" stroke="rgba(22,163,74,0.14)" strokeWidth="1.5" strokeLinecap="round">
          {paths.map((d) => <path key={d} d={d} vectorEffect="non-scaling-stroke" />)}
        </g>
      </svg>
      {nodes.map(([x, y]) => (
        <span key={`${x}-${y}`} className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#16A34A]/60 shadow-[0_0_0_6px_rgba(22,163,74,0.10),0_0_16px_rgba(22,163,74,0.35)]" style={{ left: `${x}%`, top: `${y}%` }} />
      ))}
    </div>
  );
}

function EnergyLines() {
  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full" style={FADE_MASK} aria-hidden="true">
      <defs>
        <linearGradient id="el-g" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#15803D" stopOpacity="0" />
          <stop offset="0.5" stopColor="#15803D" stopOpacity="0.32" />
          <stop offset="1" stopColor="#15803D" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#el-g)" strokeWidth="1.2">
        <path d="M-40 560 C 220 420, 420 700, 720 540 S 1200 330, 1480 470" />
        <path d="M-40 620 C 260 500, 460 760, 760 600 S 1200 400, 1480 520" />
        <path d="M-40 680 C 300 580, 500 820, 800 660 S 1220 470, 1480 570" />
        <path d="M980 -20 L1480 480" strokeOpacity="0.5" />
        <path d="M1100 -20 L1480 360" strokeOpacity="0.5" />
      </g>
      <g fill="#15803D" fillOpacity="0.28">
        <circle cx="720" cy="540" r="4" /><circle cx="760" cy="600" r="4" /><circle cx="800" cy="660" r="4" /><circle cx="1200" cy="330" r="3" />
      </g>
    </svg>
  );
}

function How({ onSignup }) {
  const img = 'h-full w-full object-cover';
  return (
    <section id="how" className="relative scroll-mt-16 overflow-hidden pb-28 pt-24 lg:pb-36 lg:pt-28" style={HOW_BG}>
      <EnergyLines />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#f8f7f2] to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#f3f2ea] to-transparent" aria-hidden="true" />
      <Flow name="how" />
      <div className={`${wrapCls} relative`}>
        <p className={tagCls}>How it works</p>
        <h2 className={`${h2Cls} mt-4 max-w-2xl`}>Simple. Connected. Greener Together.</h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">VoltShare makes EV charging easy by connecting drivers with nearby homeowners who have idle chargers. Clean energy, shared by people.</p>
        <button type="button" onClick={onSignup} className={`${btnGreen} mt-7`}>Get Started <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Step n={STEPS[0][0]} title={STEPS[0][1]} text={STEPS[0][2]}>
            <img src="/images/how-map.webp" alt="Map of nearby home chargers" loading="lazy" className={img} />
            <Pill icon={<MapPin className="h-4 w-4" aria-hidden="true" />} title="Nearby Chargers" sub="Within 2 km" arrow />
          </Step>
          <Step n={STEPS[1][0]} title={STEPS[1][1]} text={STEPS[1][2]}>
            <img src="/images/how-phone.webp" alt="Phone showing a home charger booking" loading="lazy" className={`${img} object-top`} />
          </Step>
          <Step n={STEPS[2][0]} title={STEPS[2][1]} text={STEPS[2][2]}>
            <img src="/images/how-charging.webp" alt="Charging connector with a glowing green ring" loading="lazy" className={img} />
            <Pill icon={<Zap className="h-4 w-4" aria-hidden="true" />} title="Charging…" sub="22.4 kWh · 48 min left" />
          </Step>
          <Step n={STEPS[3][0]} title={STEPS[3][1]} text={STEPS[3][2]}>
            <div className="flex h-full flex-col justify-between rounded-2xl bg-gradient-to-br from-green-50 to-white p-4 ring-1 ring-green-100">
              <div className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#15803D] text-white"><Check className="h-4 w-4" aria-hidden="true" /></span><span className="text-sm font-semibold">Session Completed</span></div>
              <dl className="space-y-1.5 text-xs text-slate-600">
                {[['Energy Used', '18.6 kWh'], ['Rate', '₹14/kWh'], ['Total Amount', '₹260']].map(([k, v]) => (<div key={k} className="flex justify-between"><dt>{k}</dt><dd className="font-semibold text-[#0F172A]">{v}</dd></div>))}
              </dl>
            </div>
          </Step>
        </div>
      </div>
    </section>
  );
}

function Contact({ c }) {
  const err = (m) => m && <p className="mt-1 text-xs text-rose-600">{m}</p>;
  return (
    <section id="contact" className="relative scroll-mt-16 overflow-hidden py-24 lg:py-32" style={CONTACT_BG}>
      <Flow name="contact" mask={FADE_OUT} />
      <div className={`${wrapCls} relative grid items-center gap-14 lg:grid-cols-[0.8fr_1.6fr]`}>
        <div>
          <p className={tagCls}>Contact us</p>
          <h2 className={`${h2Cls} mt-4`}>Let’s Charge a Greener Tomorrow.</h2>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-slate-600">Have questions, suggestions, or partnership ideas? Reach out to our team and we will get back to you soon.</p>
          <ul className="mt-8 space-y-4 text-sm text-slate-700">
            {[[MapPin, BRAND.address, null], [Phone, BRAND.phone, BRAND.phoneHref], [Mail, BRAND.email, `mailto:${BRAND.email}`]].map(([Icon, text, href]) => (
              <li key={text} className="flex items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-green-50 text-[#15803D]"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                {href ? <a href={href} className={`rounded transition hover:text-[#15803D] ${ring}`}>{text}</a> : <span>{text}</span>}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative lg:min-h-[560px]">
          <div className="absolute inset-x-0 -bottom-5 -top-5 rounded-[2rem] bg-[#14532D] lg:left-[32%]" aria-hidden="true" />
          <div className="relative lg:absolute lg:left-0 lg:top-2 lg:h-[500px] lg:w-[52%]">
            <img src="/images/contact-photo.webp" alt="Wooden home with a wallbox charging a green car in the evening sun" loading="lazy" className="h-64 w-full rounded-3xl object-cover shadow-[0_20px_50px_rgba(0,0,0,0.18)] sm:h-80 lg:h-full" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 text-xs shadow-lg backdrop-blur-md sm:right-auto lg:max-w-[88%]">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-green-50 text-[#15803D]"><Leaf className="h-4 w-4" aria-hidden="true" /></span>
              <span className="leading-snug"><span className="block font-semibold text-[#0F172A]">Cleaner communities</span><span className="text-slate-500">start with conversations.</span></span>
            </div>
          </div>
          <form onSubmit={c.onSubmit} noValidate className={`${cardCls} relative mx-3 -mt-6 p-6 sm:p-8 lg:ml-auto lg:mr-0 lg:mt-12 lg:w-[60%] lg:shadow-[0_30px_70px_rgba(0,0,0,0.2)]`}>
            <h3 className="font-display text-3xl font-semibold text-[#0F172A]">Send us a Message</h3>
            <p className="mt-1.5 text-sm text-slate-500">Fill out the form and our team will get back to you as soon as possible.</p>
            {c.status.text && (<p role={c.status.type === 'error' ? 'alert' : 'status'} className={`mt-4 rounded-xl px-4 py-3 text-sm ${c.status.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-green-50 text-green-800'}`}>{c.status.text}</p>)}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div><label htmlFor="lc-name" className="sr-only">Name</label><input id="lc-name" type="text" autoComplete="name" placeholder="Name" value={c.name} onChange={(e) => c.setName(e.target.value)} aria-invalid={!!c.errors.name} className={inputCls} />{err(c.errors.name)}</div>
              <div><label htmlFor="lc-email" className="sr-only">Email</label><input id="lc-email" type="email" autoComplete="email" placeholder="Email" value={c.email} onChange={(e) => c.setEmail(e.target.value)} aria-invalid={!!c.errors.email} className={inputCls} />{err(c.errors.email)}</div>
            </div>
            <div className="mt-3">
              <label htmlFor="lc-role" className="sr-only">I am a</label>
              <select id="lc-role" value={c.subject} onChange={(e) => c.setSubject(e.target.value)} aria-invalid={!!c.errors.subject} className={`${inputCls} ${c.subject ? '' : 'text-slate-400'}`}>
                <option value="">I am a… (select an option)</option>
                <option value="I am an EV Driver">EV Driver</option>
                <option value="I am a Home Host">Home Host</option>
              </select>
              {err(c.errors.subject && 'Please choose an option.')}
            </div>
            <div className="mt-3">
              <label htmlFor="lc-msg" className="sr-only">Message</label>
              <textarea id="lc-msg" rows={4} placeholder="Type your message here…" value={c.message} onChange={(e) => c.setMessage(e.target.value)} aria-invalid={!!c.errors.message} className={`${inputCls} resize-none`} />
              {err(c.errors.message)}
            </div>
            <button type="submit" disabled={c.busy} className={`${btnGreen} mt-5 w-full justify-between !bg-[#14532D] hover:!bg-[#0f3f23] disabled:opacity-60`}>
              <span className="flex-1 text-center">{c.busy ? 'Sending…' : 'Send Message'}</span>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15">{c.busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Footer({ onSignup, onPrivacy }) {
  const link = `rounded text-sm text-white/90 transition hover:text-white hover:underline underline-offset-4 ${ring} focus-visible:ring-offset-transparent`;
  return (
    <footer className="relative isolate overflow-hidden text-white">
      <img src="/images/footer-bg.webp" alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover object-bottom" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/25 to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 -z-10" style={{ backgroundImage: `linear-gradient(to bottom, ${C.contactEnd} 0%, rgba(246,245,238,0.65) 18%, rgba(246,245,238,0) 45%)` }} aria-hidden="true" />
      <div className={`${wrapCls} flex flex-col justify-end pb-6 pt-20`} style={{ minHeight: 'clamp(380px, 24vw, 500px)' }}>
        <div className="grid items-center gap-8 pb-8 lg:grid-cols-[auto_1fr_auto_auto] lg:gap-0">
          <div className="lg:pr-9"><Logo light onClick={() => goTo('home')} /></div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-7 gap-y-2 lg:border-l lg:border-white/20 lg:px-9">
            {NAV.map(([id, label]) => (<button key={id} type="button" onClick={() => goTo(id)} className={link}>{label}</button>))}
            <button type="button" onClick={onSignup} className={link}>Sign Up</button>
          </nav>
          <div className="flex gap-3 lg:border-l lg:border-white/20 lg:px-9">
            {SOCIALS.map(([name, href, paths]) => (
              <a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={name} className={`grid h-10 w-10 place-items-center rounded-full border border-white/70 transition hover:-translate-y-0.5 hover:bg-white hover:text-[#14532D] ${ring} focus-visible:ring-offset-transparent`}>
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths}</svg>
              </a>
            ))}
          </div>
          <p className="flex items-start gap-3 text-sm leading-snug text-white/90 lg:max-w-[15rem] lg:border-l lg:border-white/20 lg:pl-9"><MapPin className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />{BRAND.address}</p>
        </div>
        <p className="border-t border-white/15 pt-4 text-xs text-white/70">
          © {new Date().getFullYear()} VoltShare. All rights reserved. ·{' '}
          <button type="button" onClick={onPrivacy} className={`rounded underline underline-offset-2 hover:text-white ${ring} focus-visible:ring-offset-transparent`}>Privacy policy</button>
        </p>
      </div>
    </footer>
  );
}

/* ---- Page ---- */
export default function Landing({ onLogin, onSignup, onPrivacy, contact }) {
  const [active, setActive] = useState('home');
  useEffect(() => {
    const els = NAV.map(([id]) => document.getElementById(id)).filter(Boolean);
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-45% 0px -50% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <div className="font-sans">
      <Header active={active} onLogin={onLogin} onSignup={onSignup} />
      <main>
        <Hero onSignup={onSignup} />
        <About onHow={() => goTo('how')} />
        <How onSignup={onSignup} />
        <Contact c={contact} />
      </main>
      <Footer onSignup={onSignup} onPrivacy={onPrivacy} />
    </div>
  );
}