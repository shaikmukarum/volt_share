import React, { useState, useEffect, useRef } from 'react';
import Landing from './Landing.jsx';
import HostWorkspace from './HostWorkspace.jsx';
import ChargerMap from './ui/ChargerMap.jsx';
import ChargerCard from './ui/ChargerCard.jsx';
import LiveSession from './ui/LiveSession.jsx';
import MemberHome from './ui/MemberHome.jsx';
import HistoryRows from './ui/HistoryRows.jsx';
import { AboutPage, FaqSection } from './ui/InfoPages.jsx';
import { wrap, card, focusRing, btnBase, btnPrimary, btnGhost, btnDanger, inputCls, labelCls, menuItem, pill, eyebrow, h1Cls, statusCls, statusLabel } from './ui/tokens.js';
import {
  Zap, BatteryCharging, MapPin, ShieldCheck, Menu, X, CheckCircle2, AlertCircle, Info,
  Phone, Mail, ChevronRight, ArrowUpRight, LogOut, User, Siren, RefreshCw, Leaf, Receipt,
  KeyRound, IndianRupee, Loader2, Send, Plug, Gauge, Car, Eye, EyeOff,
  History as HistoryIcon, ChevronDown, LayoutDashboard, Users,
  Copy, Check, Navigation, Hourglass, Sun, Moon, Palette
} from 'lucide-react';

// Relative by default: goes through the Vite proxy, so it works for you AND for anyone using your shared link.
// (Set VITE_API_BASE only if you host the backend somewhere else.)
const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const DRIVER_LOCATION = { lat: 13.445, lng: 77.602 }; // search + distance origin (same as before)
const POLL_MS = 4000; // how often requests / acceptances refresh while the tab is visible

/* ------------------------------------------------------------------ */
/* Site constants (replace with your real production values)           */
/* ------------------------------------------------------------------ */
const SITE_URL = 'https://voltshare.example.com'; // TODO: your production domain, no trailing slash
const CONTACT_PHONE_DISPLAY = '+91 80 4000 1234'; // TODO: real support number
const CONTACT_PHONE_HREF = 'tel:+918040001234';
const CONTACT_EMAIL = 'support@voltshare.com';

/* ------------------------------------------------------------------ */
/* Routing + SEO metadata (one entry per view)                         */
/* ------------------------------------------------------------------ */
const ROUTES = { home: '/', stations: '/stations', host: '/host', admin: '/admin', contact: '/contact', privacy: '/privacy', history: '/history', about: '/about' };
const ROLE_VIEW = { DRIVER: 'stations', HOST: 'host', ADMIN: 'admin' };
// Date filter options for the driver's Charging history (label, days back)
const HISTORY_RANGES = { '30d': ['Last 30 Days', 30], '3m': ['Last 3 Months', 92], '6m': ['Last 6 Months', 183], all: ['All time', Infinity] };
const VIEW_ROLE = { stations: 'DRIVER', host: 'HOST', admin: 'ADMIN' };
const pathToView = (p) => {
  const clean = p.replace(/\/+$/, '') || '/';
  const hit = Object.entries(ROUTES).find(([, path]) => path === clean);
  return hit ? hit[0] : 'notfound';
};

const PAGES = {
  home: {
    title: 'VoltShare | Community EV Charging & Fair-Price Energy Sharing',
    description: 'Book a neighbour\'s Type-2 wallbox, CCS2 fast charger or 15A socket. Capped tariffs of ₹11 to ₹16 per kWh, OTP-verified sessions and addresses shared only after approval.'
  },
  stations: {
    title: 'Find Nearby EV Chargers | VoltShare',
    description: 'Search community EV chargers within 1 to 10 km. Filter by CCS2, Type-2 AC or 15A socket, compare kW speeds and tariffs, and book a one-hour slot.'
  },
  host: {
    title: 'Host Console: List Your Home EV Charger | VoltShare',
    description: 'List your idle home charger, set a fair tariff between ₹11 and ₹16 per kWh, verify drivers with a 4-digit OTP and settle every session with a clear bill.'
  },
  admin: {
    title: 'Admin Control & ESG Impact Dashboard | VoltShare',
    description: 'Live VoltShare analytics: completed sessions, clean energy shared in kWh, CO2 prevented, platform fee revenue and community host payouts.'
  },
  contact: {
    title: 'Contact & Support | VoltShare',
    description: 'Questions about a booking, a charger or your account? Send VoltShare support a message with your station ID, or call and email us directly.'
  },
  privacy: {
    title: 'Privacy Policy | VoltShare',
    description: 'How VoltShare collects, protects and uses your data, including how host addresses stay hidden until a booking is approved.'
  },
  history: {
    title: 'Your History | VoltShare',
    description: 'Review your VoltShare charging sessions, booking IDs, start OTPs, unlocked addresses and host earnings.'
  },
  about: {
    title: 'About VoltShare | Community EV Charging',
    description: 'How VoltShare works: neighbourhood home chargers, capped ₹11 to ₹16 per kWh tariffs, PIN-verified sessions and private addresses. Connector guide and FAQs.'
  },
  notfound: {
    title: 'Station Not Found | VoltShare',
    description: 'This route is offline. Return to the VoltShare dashboard to find chargers, host a charger or contact support.'
  }
};

const setHeadTag = (tag, key, keyValue, attr, value) => {
  let el = document.head.querySelector(`${tag}[${key}="${keyValue}"]`);
  if (!el) {
    el = document.createElement(tag);
    el.setAttribute(key, keyValue);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
};

// Lightweight document-head manager: title, description, canonical, robots, Open Graph
function useDocumentHead(view) {
  useEffect(() => {
    const page = PAGES[view] || PAGES.notfound;
    const canonical = `${SITE_URL}${ROUTES[view] || '/'}`;
    document.title = page.title;
    setHeadTag('meta', 'name', 'description', 'content', page.description);
    setHeadTag('meta', 'name', 'robots', 'content', view === 'notfound' ? 'noindex,follow' : 'index,follow');
    setHeadTag('link', 'rel', 'canonical', 'href', canonical);
    setHeadTag('meta', 'property', 'og:title', 'content', page.title);
    setHeadTag('meta', 'property', 'og:description', 'content', page.description);
    setHeadTag('meta', 'property', 'og:url', 'content', canonical);
  }, [view]);
}

/* ------------------------------------------------------------------ */
/* Shared style tokens                                                 */
/* ------------------------------------------------------------------ */
/* Optimized image: WebP, explicit size, lazy unless it is the hero */
function Img({ src, alt, width, height, priority = false, className = '' }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-zinc-900 to-zinc-950 ${className}`}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        className="h-full w-full object-cover"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    </div>
  );
}

function InlineAlert({ type, children }) {
  const ok = type === 'success';
  const Icon = ok ? CheckCircle2 : AlertCircle;
  return (
    <div
      role={ok ? 'status' : 'alert'}
      className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${
        ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export default function App() {
  const [activeRole, setActiveRole] = useState('DRIVER'); // 'DRIVER' | 'HOST' | 'ADMIN'
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  // Auth Inputs
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authOpen, setAuthOpen] = useState(false); // Log In / Sign Up modal on the landing page
  const [authRole, setAuthRole] = useState('DRIVER'); // UI "User" => 'DRIVER', UI "Host" => 'HOST'

  // Driver States
  const [chargers, setChargers] = useState([]);
  const [radius, setRadius] = useState(5);
  const [connectorFilter, setConnectorFilter] = useState('');
  const [myBookings, setMyBookings] = useState([]);
  const [sosActive, setSosActive] = useState(false);
  const [sessionOtp, setSessionOtp] = useState(''); // the driver's ONE Session PIN
  const [pinCopied, setPinCopied] = useState(false);

  // Host States ("Sharma Uncle")
  const [newTitle, setNewTitle] = useState('');
  const [newArea, setNewArea] = useState('Green Park Colony');
  const [newAddress, setNewAddress] = useState('House #42, Block B, Green Park Colony');
  const [newConnector, setNewConnector] = useState('CCS2');
  const [newPower, setNewPower] = useState(7.2);
  const [newPrice, setNewPrice] = useState(14.0); // Guardrail: 11 - 16
  const [otpInput, setOtpInput] = useState({});
  const [unitsInput, setUnitsInput] = useState({});
  const [latestBill, setLatestBill] = useState(null);

  // Admin States
  const [analytics, setAnalytics] = useState(null);

  // Host bookings + billing records (dispatcher and history)
  const [hostBookings, setHostBookings] = useState([]);

  // Profile dropdown
  const [profileOpen, setProfileOpen] = useState(false);
  // Find Charge UI state (map search, filter panel, highlighted pin/card, live-monitor toggle)
  const [finderQuery, setFinderQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeChargerId, setActiveChargerId] = useState(null);
  const [showFinder, setShowFinder] = useState(false);
  const [historyRange, setHistoryRange] = useState('6m');
  const [scrolled, setScrolled] = useState(false);
  // Theme: Light by default (localStorage fallback = 'light')
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
  });
  const [themeSwitching, setThemeSwitching] = useState(false);
  const themeTimer = useRef(null);
  // Profile editor modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '', description: '' });
  const [profileMeta, setProfileMeta] = useState({ email: '', phone: '' });
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const profileRef = useRef(null);
  const prevDriverStatus = useRef(null); // booking_id -> status, to announce acceptances
  const knownHostBookings = useRef(null); // Set of booking ids, to announce new requests
  const bannerTimer = useRef(null);

  // Status message banner
  const [banner, setBanner] = useState({ text: '', type: '' });

  // UI-only state (view routing, mobile menu, loading flags, contact form)
  const [view, setView] = useState(() => pathToView(window.location.pathname));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [busy, setBusy] = useState('');
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cSubject, setCSubject] = useState('');
  const [cMessage, setCMessage] = useState('');
  const [cErrors, setCErrors] = useState({});
  const [cStatus, setCStatus] = useState({ type: '', text: '' });

  // Automatically detect whether the authenticated user is an Admin
  const isAdmin = Boolean(
    currentUser &&
      (String(currentUser.role || '').toUpperCase() === 'ADMIN' ||
        String(currentUser.email || '').toLowerCase() === 'admin@voltshare.com')
  );

  const userRole = isAdmin ? 'ADMIN' : String(currentUser?.role || '').toUpperCase() === 'HOST' ? 'HOST' : 'DRIVER';
  const isHost = userRole === 'HOST';
  const homeView = isAdmin ? 'admin' : isHost ? 'host' : 'stations';
  const roleLabel = isAdmin ? 'Admin' : isHost ? 'Host' : 'User';

  useDocumentHead(token ? view : view === 'privacy' ? 'privacy' : 'home');

  const notify = (text, type = 'info') => {
    setBanner({ text, type });
    clearTimeout(bannerTimer.current); // an older toast's timer must not wipe a newer toast early
    bannerTimer.current = setTimeout(() => setBanner({ text: '', type: '' }), 4500);
  };

  // Runs an existing handler and exposes a loading flag for its button
  const withBusy = async (key, fn) => {
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy('');
    }
  };

  /* ---------------------------------------------------------------- */
  /* Navigation (client-side routes with real URLs)                    */
  /* ---------------------------------------------------------------- */
  const navigate = (next) => {
    const path = ROUTES[next] || window.location.pathname;
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
    if (VIEW_ROLE[next]) setActiveRole(VIEW_ROLE[next]);
    setView(next);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Always returns the auth card to a fresh, empty Sign In form
  const resetAuthForm = () => {
    setIsRegistering(false);
    setAuthName('');
    setAuthEmail('');
    setAuthPassword('');
    setAuthPhone('');
    setShowPassword(false);
    setAuthRole('DRIVER');
  };

  const applyAuthenticatedSession = (authToken, userObj, welcomeText) => {
    const rawRole = String(userObj?.role || '').toUpperCase();
    const detectedAdmin =
      rawRole === 'ADMIN' ||
      String(userObj?.email || '').toLowerCase() === 'admin@voltshare.com';
    const nextRole = detectedAdmin ? 'ADMIN' : rawRole === 'HOST' ? 'HOST' : 'DRIVER';
    const nextView = nextRole === 'DRIVER' ? 'home' : ROLE_VIEW[nextRole]; // drivers land on Home after login

    // The Session PIN stays in memory only (it is re-fetched from the server), never in localStorage
    const { session_otp: loginOtp, ...storableUser } = userObj || {};
    setSessionOtp(loginOtp || '');
    prevDriverStatus.current = null;
    knownHostBookings.current = null;
    setToken(authToken);
    setCurrentUser(storableUser);
    setActiveRole(nextRole);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(storableUser));
    resetAuthForm();
    setAuthOpen(false);
    setProfileOpen(false);
    navigate(nextView);
    notify(welcomeText || `Welcome ${userObj.full_name}`, 'success');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/auth/register' : '/auth/login';
    // Role toggle mapping: "User" => 'DRIVER', "Host" => 'HOST' (existing backend roles).
    const payload = isRegistering
      ? { full_name: authName, email: authEmail, password: authPassword, phone: authPhone, role: authRole }
      : { email: authEmail, password: authPassword };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (isRegistering) {
        if (data.token && data.user) {
          applyAuthenticatedSession(data.token, data.user, `Account created! Welcome, ${data.user.full_name}`);
          return;
        }
        // Automatically sign in the newly registered user
        const loginRes = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail, password: authPassword })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok && loginData.token) {
          applyAuthenticatedSession(loginData.token, loginData.user, `Account created! Welcome, ${loginData.user.full_name}`);
        } else {
          notify('Registered successfully! Please sign in.', 'success');
          resetAuthForm();
        }
      } else {
        const accountRole = String(data.user?.role || '').toUpperCase();
        const mismatch = accountRole !== 'ADMIN' && accountRole !== authRole;
        applyAuthenticatedSession(
          data.token,
          data.user,
          mismatch
            ? `Signed in as ${accountRole === 'HOST' ? 'Host' : 'User'}, which is how this account was registered.`
            : `Welcome ${data.user.full_name}`
        );
      }
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const logout = () => {
    setToken('');
    setCurrentUser(null);
    setActiveRole('DRIVER');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    resetAuthForm(); // fresh, empty Sign In form (never a pre-filled Register form)
    setAuthOpen(false);
    setProfileOpen(false);
    setMobileOpen(false);
    setChargers([]);
    setMyBookings([]);
    setHostBookings([]);
    setAnalytics(null);
    setLatestBill(null);
    setOtpInput({});
    setUnitsInput({});
    setSessionOtp('');
    setProfileModalOpen(false);
    prevDriverStatus.current = null;
    knownHostBookings.current = null;
    navigate('home');
    notify('Logged out', 'info');
  };

  // Fetch Nearby Chargers (Driver / Standard User)
  const fetchNearbyChargers = async () => {
    if (!token || userRole !== 'DRIVER') return;
    try {
      let url = `${API_BASE}/chargers/nearby?lat=${DRIVER_LOCATION.lat}&lng=${DRIVER_LOCATION.lng}&radius_km=${radius}`;
      if (connectorFilter) url += `&connector_type=${connectorFilter}`;
      if (sosActive) url += `&sos_only=true`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setChargers(data);
    } catch (err) {
      console.error(err);
    }
  };

  // A dead/expired token during background refresh should send the person back to sign in
  const isAuthFailure = (res, data) => res.status === 401 || (res.status === 403 && /token/i.test(data?.error || ''));

  // Fetch Bookings (Unlocked for any authenticated user). Also powers the "Accepted Hosts" list.
  const fetchDriverBookings = async () => {
    if (!token || userRole !== 'DRIVER') return;
    try {
      const res = await fetch(`${API_BASE}/bookings/my?lat=${DRIVER_LOCATION.lat}&lng=${DRIVER_LOCATION.lng}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        const prev = prevDriverStatus.current;
        if (prev) {
          data.forEach((b) => {
            if (b.status === 'APPROVED' && prev[b.booking_id] === 'REQUESTED') {
              notify(`${b.host_name} accepted your request${b.distance_km != null ? ` (${Number(b.distance_km).toFixed(2)} km away)` : ''}. See Accepted Hosts.`, 'success');
            }
          });
        }
        prevDriverStatus.current = Object.fromEntries(data.map((b) => [b.booking_id, b.status]));
        setMyBookings(data);
      } else if (isAuthFailure(res, data)) {
        logout();
        notify('Your session expired. Please sign in again.', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch the driver's single Session PIN (stays correct after refresh or a login on another device)
  const fetchSessionOtp = async () => {
    if (!token || userRole !== 'DRIVER') return;
    try {
      const res = await fetch(`${API_BASE}/session/otp`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok && data.session_otp) setSessionOtp(data.session_otp);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Host bookings + billing records
  const fetchHostBookings = async () => {
    if (!token || userRole !== 'HOST') return;
    try {
      const res = await fetch(`${API_BASE}/bookings/host`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        const known = knownHostBookings.current;
        if (known) {
          const fresh = data.filter((b) => b.status === 'REQUESTED' && !known.has(b.booking_id));
          if (fresh.length > 0) {
            notify(fresh.length === 1 ? `New charging request from ${fresh[0].driver_name}` : `${fresh.length} new charging requests`, 'info');
          }
        }
        knownHostBookings.current = new Set(data.map((b) => b.booking_id));
        setHostBookings(data);
      } else if (isAuthFailure(res, data)) {
        logout();
        notify('Your session expired. Please sign in again.', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Admin Analytics
  const fetchAdminAnalytics = async () => {
    if (!token || !isAdmin) return;
    try {
      const res = await fetch(`${API_BASE}/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setAnalytics(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!token) return;
    if (isAdmin) {
      fetchAdminAnalytics();
    } else if (isHost) {
      fetchHostBookings();
    } else {
      fetchNearbyChargers();
      fetchDriverBookings();
      fetchSessionOtp();
    }
  }, [view, activeRole, token, isAdmin, isHost, radius, connectorFilter, sosActive]);

  // Real-time feel (Uber-style): requests, acceptances and withdrawals refresh every few seconds
  useEffect(() => {
    if (!token || isAdmin) return undefined;
    if (!['stations', 'host', 'history'].includes(view)) return undefined;
    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      if (isHost) {
        fetchHostBookings();
      } else {
        fetchDriverBookings();
        fetchSessionOtp();
      }
    };
    const id = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [token, isAdmin, isHost, view]);

  // Request Booking (Use Service)
  const handleBookSlot = async (chargerId, isSos = false) => {
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          charger_id: chargerId,
          vehicle_id: 1, // Default test EV
          // slot_start / slot_end are stamped with the real booking time by the server
          is_sos_emergency: isSos
        })
      });
      const data = await res.json();
      if (!res.ok) {
        // e.g. "Request already sent to this host": resync so the button flips to "Request Sent ✓"
        if (/already sent/i.test(data.error || '')) await fetchDriverBookings();
        throw new Error(data.error);
      }
      if (data.session_otp) setSessionOtp(data.session_otp);
      notify(`Request sent! Your Session PIN is ${data.session_otp || sessionOtp}. The address unlocks when the host accepts.`, 'success');
      await fetchDriverBookings();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const copyPin = async () => {
    try {
      await navigator.clipboard.writeText(sessionOtp);
      setPinCopied(true);
      setTimeout(() => setPinCopied(false), 1800);
    } catch {
      notify('Could not copy automatically. Please note the PIN down.', 'error');
    }
  };

  const changeTheme = (next) => {
    if (next === theme) return;
    setThemeSwitching(true); // enables the 300ms colour cross-fade for this toggle only
    setTheme(next);
    try { localStorage.setItem('theme', next); } catch { /* storage unavailable: theme still applies for this visit */ }
    clearTimeout(themeTimer.current);
    themeTimer.current = setTimeout(() => setThemeSwitching(false), 450);
  };

  const openProfile = async () => {
    setProfileOpen(false);
    setMobileOpen(false);
    setProfileError('');
    setProfileForm({ full_name: currentUser?.full_name || '', description: '' });
    setProfileMeta({ email: '', phone: '' });
    setProfileModalOpen(true);
    setProfileLoading(true);
    try {
      const res = await fetch(`${API_BASE}/profile`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfileForm({ full_name: data.full_name || '', description: data.description || '' });
      setProfileMeta({ email: data.email || '', phone: data.phone || '' });
    } catch (err) {
      setProfileError(err.message || 'Could not load your profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    const name = profileForm.full_name.trim();
    if (!name) { setProfileError('Name is required.'); return; } // description is optional: no check
    setProfileError('');
    setProfileSaving(true);
    try {
      const res = await fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ full_name: name, description: profileForm.description })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const updated = { ...currentUser, full_name: data.user.full_name }; // header + menu update immediately
      setCurrentUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      setProfileModalOpen(false);
      notify('Profile updated.', 'success');
    } catch (err) {
      setProfileError(err.message || 'Could not save your profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Register Charger (Provide Service - Guardrail Enforced)
  const handleRegisterCharger = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/chargers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          area_name: newArea,
          full_address: newAddress,
          latitude: 13.443268,
          longitude: 77.601234,
          connector_type: newConnector,
          power_kw: parseFloat(newPower),
          price_per_kwh: parseFloat(newPrice)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify('Charger registered successfully within fair-price bounds!', 'success');
      setNewTitle('');
      fetchNearbyChargers();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // Host Action: Accept a driver's request
  const handleApproveBooking = async (bookingId) => {
    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify(data.message, 'success');
      fetchHostBookings();
    } catch (err) {
      notify(err.message, 'error');
      fetchHostBookings(); // the request may have been withdrawn: refresh the queue
    }
  };

  // Host Action: Start Session with the driver's OTP
  const handleStartSession = async (bookingId) => {
    const enteredOtp = otpInput[bookingId];
    if (!enteredOtp) return notify('Please enter the 4-digit OTP provided by the driver', 'error');

    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/start-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ otp: enteredOtp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify('Handshake Verified! Session is now CHARGING_ACTIVE.', 'success');
      fetchHostBookings();
    } catch (err) {
      notify(err.message, 'error');
      fetchHostBookings();
    }
  };

  // Host Action: Complete Session & Generate Bill
  const handleCompleteSession = async (bookingId) => {
    const units = unitsInput[bookingId];
    if (!units) return notify('Enter electricity units consumed (kWh)', 'error');

    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/complete-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ units_consumed_kwh: parseFloat(units) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLatestBill(data.bill_summary);
      notify('Session completed and bill settled!', 'success');
      fetchHostBookings();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  useEffect(() => {
    const onPop = () => {
      const next = pathToView(window.location.pathname);
      if (VIEW_ROLE[next]) setActiveRole(VIEW_ROLE[next]);
      setView(next);
    };
    if (VIEW_ROLE[view]) setActiveRole(VIEW_ROLE[view]);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Route protection & automatic role routing
  useEffect(() => {
    if (!token) {
      // When logged out, keep user on the login/landing page (allow privacy policy link if clicked)
      if (view !== 'home' && view !== 'privacy') {
        navigate('home');
      }
      return;
    }
    // Signed-in members may stay on the Home tab; every other view is still guarded by role
    if (isAdmin) {
      // Admin accounts are detected automatically and routed to the Admin Dashboard
      if (view === 'stations' || view === 'host' || view === 'history') {
        navigate('admin');
      }
    } else if (isHost) {
      if (view === 'admin' || view === 'stations') {
        navigate('host');
      }
    } else if (view === 'admin' || view === 'host') {
      navigate('stations');
    }
  }, [token, isAdmin, isHost, view]);

  useEffect(() => {
    if (!authOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setAuthOpen(false); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [authOpen]);

  useEffect(() => {
    if (!profileOpen) return;
    const onDown = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setProfileOpen(false); };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [profileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  useEffect(() => {
    if (!profileModalOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setProfileModalOpen(false); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [profileModalOpen]);

  // Header is transparent at the top and turns into frosted glass once the page scrolls
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // When no session is charging any more, the next one opens straight on the live monitor again
  useEffect(() => {
    if (!myBookings.some((b) => b.status === 'CHARGING_ACTIVE')) setShowFinder(false);
  }, [myBookings]);

  // Pin click: highlight and bring the matching card into view
  const selectCharger = (id) => {
    setActiveChargerId(id);
    document.getElementById(`charger-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const link = (target, children, cls = '') => (
    <a
      href={ROUTES[target]}
      onClick={(e) => { e.preventDefault(); navigate(target); }}
      className={`rounded ${focusRing} ${cls}`}
    >
      {children}
    </a>
  );

  // Navigation items shown ONLY after login
  const AUTH_NAV = isAdmin
    ? [
        { id: 'home', label: 'Home' },
        { id: 'admin', label: 'Admin control' },
        { id: 'about', label: 'About' },
        { id: 'contact', label: 'Support' }
      ]
    : isHost
    ? [
        { id: 'home', label: 'Home' },
        { id: 'host', label: 'Host Workspace' },
        { id: 'history', label: 'History' },
        { id: 'about', label: 'About' },
        { id: 'contact', label: 'Support' }
      ]
    : [
        { id: 'home', label: 'Home' },
        { id: 'stations', label: 'Find Charge' },
        { id: 'history', label: 'Charging History' },
        { id: 'about', label: 'About' },
        { id: 'contact', label: 'Support' }
      ];

  const renderCrumbs = (items) => (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-400">
        {items.map((it, i) => (
          <li key={it.label} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-zinc-600" aria-hidden="true" />}
            {it.view ? (
              link(it.view, it.label, 'hover:text-zinc-100')
            ) : (
              <span aria-current="page" className="text-zinc-200">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );

  /* ---------------------------------------------------------------- */
  /* Contact form                                                      */
  /* ---------------------------------------------------------------- */
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (cName.trim().length < 2) errors.name = 'Enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cEmail.trim())) errors.email = 'Enter a valid email address.';
    if (cSubject.trim().length < 3) errors.subject = 'Add a subject or station ID.';
    if (cMessage.trim().length < 10) errors.message = 'Tell us a little more (at least 10 characters).';
    setCErrors(errors);
    setCStatus({ type: '', text: '' });
    if (Object.keys(errors).length) return;

    setBusy('contact');
    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cName.trim(), email: cEmail.trim(), subject: cSubject.trim(), message: cMessage.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'We could not send your message.');
      setCStatus({ type: 'success', text: 'Message sent. Our support team will reply to your email within one working day.' });
      setCName(''); setCEmail(''); setCSubject(''); setCMessage('');
    } catch (err) {
      setCStatus({ type: 'error', text: `${err.message} Please try again, or email ${CONTACT_EMAIL}.` });
    } finally {
      setBusy('');
    }
  };

  /* ---------------------------------------------------------------- */
  /* Unified Auth Card (No role segregation, no demo buttons)          */
  /* ---------------------------------------------------------------- */
  const renderAuthCard = () => (
    <section aria-labelledby="auth-title" className={`${card} p-6 sm:p-8`}>
      <h2 id="auth-title" className="text-xl font-semibold tracking-tight text-zinc-100">
        {isRegistering ? 'Create your VoltShare account' : 'Sign in to VoltShare'}
      </h2>
      <p className="mt-1 text-sm text-zinc-400">
        {isRegistering
          ? 'Register once to book nearby EV chargers or share your own home charger.'
          : 'Enter your credentials to access charging stations, host tools, or admin controls.'}
      </p>

      <form onSubmit={(e) => withBusy('auth', () => handleAuthSubmit(e))} className="mt-6 space-y-4">
        <div>
          <span className={labelCls} id="role-toggle-label">{isRegistering ? 'Create account as' : 'Sign in as'}</span>
          <div role="radiogroup" aria-labelledby="role-toggle-label" className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-zinc-950 p-1">
            {[
              ['DRIVER', 'User', 'Locate & book chargers', Car],
              ['HOST', 'Host', 'List & activate chargers', Plug]
            ].map(([val, label, desc, Icon]) => (
              <button
                key={val}
                type="button"
                role="radio"
                aria-checked={authRole === val}
                onClick={() => setAuthRole(val)}
                className={`flex min-h-[56px] flex-col items-start justify-center rounded-lg px-3 py-2 text-left transition-all ${focusRing} ${
                  authRole === val
                    ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                }`}
              >
                <span className="flex items-center gap-1.5 text-sm font-semibold"><Icon className="h-3.5 w-3.5" aria-hidden="true" />{label}</span>
                <span className="mt-0.5 text-[11px] leading-tight opacity-80">{desc}</span>
              </button>
            ))}
          </div>
        </div>
        {isRegistering && (
          <>
            <div>
              <label htmlFor="auth-name" className={labelCls}>Full name</label>
              <input id="auth-name" type="text" required autoComplete="name" placeholder="Enter your full name" value={authName} onChange={(e) => setAuthName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="auth-phone" className={labelCls}>Phone number</label>
              <input id="auth-phone" type="tel" required autoComplete="tel" placeholder="+91 98765 43210" value={authPhone} onChange={(e) => setAuthPhone(e.target.value)} className={inputCls} />
            </div>
          </>
        )}
        <div>
          <label htmlFor="auth-email" className={labelCls}>Email address</label>
          <input id="auth-email" type="email" required autoComplete="email" placeholder="you@example.com" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="auth-password" className={labelCls}>Password</label>
          <div className="relative">
            <input id="auth-password" type={showPassword ? 'text' : 'password'} required autoComplete={isRegistering ? 'new-password' : 'current-password'} placeholder="••••••••" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className={`${inputCls} pr-11`} />
            <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className={`absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-zinc-400 hover:text-zinc-200 ${focusRing}`}>
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={busy === 'auth'} className={`${btnPrimary} w-full`}>
          {busy === 'auth' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {isRegistering ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4 text-xs text-zinc-400">
        <button type="button" onClick={() => setIsRegistering(!isRegistering)} className={`rounded font-medium text-emerald-400 hover:text-emerald-300 ${focusRing}`}>
          {isRegistering ? 'Already have an account? Sign in' : 'New to VoltShare? Create an account'}
        </button>
        <span>
          By continuing you accept our {link('privacy', 'privacy policy', 'text-zinc-300 underline underline-offset-2 hover:text-white')}.
        </span>
      </div>
    </section>
  );

  /* ---------------------------------------------------------------- */
  /* Views                                                             */
  /* ---------------------------------------------------------------- */
  const renderHome = () => (
    <>
      <section aria-labelledby="hero-title" className="relative">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden="true" />
        <div className="relative grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <h1 id="hero-title" className="text-4xl font-semibold leading-tight tracking-tight text-zinc-100 sm:text-5xl">
              Charge at a neighbour's home. Pay a fair, capped rate.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
              Book a nearby Type-2 wallbox, CCS2 fast charger or 15A socket, or list your own home charger for neighbours to use. Tariffs stay between ₹11 and ₹16 per kWh, and a host's full address unlocks only after booking approval.
            </p>
            <Img
              src="/images/ev-charging-home-wallbox.webp"
              alt="Electric car charging at a Type-2 home wallbox in a residential neighbourhood"
              width={1200}
              height={675}
              priority
              className="mt-8"
            />
          </div>

          <div className="lg:sticky lg:top-24">
            {renderAuthCard()}
          </div>
        </div>
      </section>

      <section aria-labelledby="features-title" className="mt-20 sm:mt-28">
        <h2 id="features-title" className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">Built for neighbourhood charging</h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400 sm:text-base">Sign up as a User to find and book nearby chargers, or as a Host to list your own home charger and earn from idle capacity.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [ShieldCheck, 'Private by default', 'Search shows only the area name. The full address unlocks once the host approves your booking.'],
            [IndianRupee, 'Capped, fair tariffs', 'Hosts pick a rate from ₹11 to ₹16 per kWh. No surge pricing and a clear bill after each session.'],
            [KeyRound, 'OTP-verified sessions', 'A 4-digit start OTP confirms the right driver is plugged in before charging begins.'],
            [BatteryCharging, 'Every connector', '15A wall sockets for 2W and 3W, 7.2 kW Type-2 AC wallboxes and CCS2 DC fast chargers.']
          ].map(([Icon, title, text]) => (
            <article key={title} className={`${card} p-5`}>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-zinc-100">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="how-title" className="mt-20 grid items-center gap-10 sm:mt-28 lg:grid-cols-2">
        <div>
          <h2 id="how-title" className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">How a session works</h2>
          <ol className="mt-6 space-y-5">
            {[
              ['Find or Host', 'Sign in as a User to search chargers within 1 to 10 km, or as a Host to list your own home wallbox.'],
              ['Book & Approve', 'Reserve a one-hour slot and receive your 4-digit start OTP once the charger owner approves.'],
              ['Charge & Settle', 'Share the OTP at the charger. The host starts the session and logs the exact kWh delivered.']
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-sm font-semibold text-emerald-400">{i + 1}</span>
                <div>
                  <h3 className="text-base font-semibold text-zinc-100">{t}</h3>
                  <p className="mt-0.5 text-sm text-zinc-400">{d}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-400">
            <span>Questions?</span>
            <a href={CONTACT_PHONE_HREF} className={`inline-flex items-center gap-1.5 rounded text-zinc-200 hover:text-emerald-400 ${focusRing}`}><Phone className="h-4 w-4" aria-hidden="true" />{CONTACT_PHONE_DISPLAY}</a>
            <a href={`mailto:${CONTACT_EMAIL}`} className={`inline-flex items-center gap-1.5 rounded text-zinc-200 hover:text-emerald-400 ${focusRing}`}><Mail className="h-4 w-4" aria-hidden="true" />{CONTACT_EMAIL}</a>
          </div>
        </div>
        <Img
          src="/images/community-ev-charger-installation.webp"
          alt="Host plugging a CCS2 connector into an electric hatchback parked outside a home"
          width={1000}
          height={750}
        />
      </section>
    </>
  );

  const renderStations = () => {
    if (!token) return renderHome();

    // Anti-spam + multi-host bookkeeping (all derived from the live bookings list)
    const OPEN = ['REQUESTED', 'APPROVED', 'CHARGING_ACTIVE'];
    const openBookings = myBookings.filter((b) => OPEN.includes(b.status));
    const statusByCharger = new Map(openBookings.map((b) => [b.charger_id, b.status]));
    const dist = (b) => (b.distance_km == null ? Infinity : Number(b.distance_km));
    const acceptedHosts = openBookings.filter((b) => b.status === 'APPROVED').sort((a, b) => dist(a) - dist(b));
    const liveSessions = openBookings.filter((b) => b.status === 'CHARGING_ACTIVE');
    const waiting = openBookings.filter((b) => b.status === 'REQUESTED').sort((a, b) => dist(a) - dist(b));
    const closest = acceptedHosts.length ? dist(acceptedHosts[0]) : 0;
    const kmLabel = (b) => (b.distance_km == null ? '—' : `${Number(b.distance_km).toFixed(2)} km`);
    const mapsLink = (addr) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
    const live = liveSessions[0];

    // An active session turns this tab into the Live Charging Monitor
    if (live && !showFinder) {
      return <LiveSession booking={live} onBack={() => setShowFinder(true)} />;
    }

    // Map search box: filters the list and the pins together
    const q = finderQuery.trim().toLowerCase();
    const shown = q
      ? chargers.filter((c) => [c.title, c.area_name, c.host_name, c.connector_type].some((v) => String(v || '').toLowerCase().includes(q)))
      : chargers;

    const filtersPanel = (
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="radius" className={labelCls}>Radius</label>
          <select id="radius" value={radius} onChange={(e) => setRadius(e.target.value)} className={inputCls}>
            <option value={1}>1 km (Walking)</option>
            <option value={2}>2 km (Hyper-Local)</option>
            <option value={5}>5 km (Standard)</option>
            <option value={10}>10 km (Expanded)</option>
          </select>
        </div>
        <div>
          <label htmlFor="connector" className={labelCls}>Connector</label>
          <select id="connector" value={connectorFilter} onChange={(e) => setConnectorFilter(e.target.value)} className={inputCls}>
            <option value="">All Connectors</option>
            <option value="15A_Socket">15A 3-Pin Wall Socket (2W / 3W)</option>
            <option value="Type2_Wallbox">Type-2 AC Wallbox (7.2kW)</option>
            <option value="CCS2">CCS2 DC Fast</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <button
            type="button"
            aria-pressed={sosActive}
            onClick={() => setSosActive(!sosActive)}
            className={`${sosActive ? `${btnBase} animate-pulse bg-rose-600 text-snow shadow-lg shadow-rose-950/50` : btnDanger} w-full`}
          >
            <Siren className="h-4 w-4" aria-hidden="true" />
            {sosActive ? 'SOS Boost Active' : 'SOS Emergency Boost'}
          </button>
          <p className="mt-2 text-xs text-zinc-500">Shows only chargers available right now and flags your requests as an emergency.</p>
        </div>
      </div>
    );

    return (
      <div className="space-y-10">
        <div>
          <p className={eyebrow}>User workspace</p>
          <h1 className={`${h1Cls} mt-2`}>Find a charger near you</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">Request several hosts at once. A host's address unlocks only when they accept, so you can drive to the closest one that says yes.</p>
        </div>

        {/* Single Session PIN */}
        <section aria-labelledby="pin-title" className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-500/10 via-zinc-900/70 to-zinc-900/60 p-5 backdrop-blur-md sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h2 id="pin-title" className="flex items-center gap-2 text-sm font-medium text-amber-200">
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                Your Active Charging PIN
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div
                  role="img"
                  aria-label={sessionOtp ? `Your Active Charging PIN: ${sessionOtp.split('').join(' ')}` : 'Your charging PIN is loading'}
                  className="flex items-center gap-2"
                >
                  {(sessionOtp || '----').split('').map((digit, i) => (
                    <span
                      key={i}
                      className="flex h-16 w-12 items-center justify-center rounded-xl border border-amber-400/30 bg-zinc-950 font-mono text-3xl font-bold text-amber-300 shadow-inner shadow-black/40 sm:h-[4.5rem] sm:w-14 sm:text-4xl"
                    >
                      {digit}
                    </span>
                  ))}
                </div>
                <button type="button" disabled={!sessionOtp} onClick={copyPin} className={btnGhost} aria-label="Copy charging PIN">
                  {pinCopied ? <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                  {pinCopied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-zinc-400">
              One PIN covers every request you send in this session. Tell it to the host only when you arrive: they enter it to start charging, and your other pending requests are cancelled automatically.
            </p>
          </div>
        </section>

{/* Live session banner when browsing during a session */}

        {live && (
          <button
            type="button"
            onClick={() => setShowFinder(false)}
            className={`vs-card flex w-full items-center justify-between gap-3 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-left backdrop-blur-xl transition-colors hover:bg-emerald-500/15 ${focusRing}`}
          >
            <span className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5 shrink-0"><span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 motion-safe:animate-ping" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" /></span>
              <span>
                <span className="block text-sm font-semibold text-zinc-100">Charging in progress at {live.title}</span>
                <span className="block text-xs text-zinc-400">Open the live charging monitor</span>
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
          </button>
        )}

        {/* Accepted Hosts - Ready to Drive */}
        {acceptedHosts.length > 0 && (
          <section aria-labelledby="accepted-title" className={`${card} border-emerald-500/20 p-5 sm:p-6`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="accepted-title" className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight text-zinc-100">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                  Accepted Hosts - Ready to Drive
                </h2>
                <p className="mt-1 text-sm text-zinc-400">These hosts accepted your request. Their exact address and phone are unlocked, so compare and drive to the closest one.</p>
              </div>
              <span className={pill}>{acceptedHosts.length} accepted</span>
            </div>
            <ul className="mt-5 grid gap-4 md:grid-cols-2">
              {acceptedHosts.map((b, i) => {
                const isClosest = i === 0 && acceptedHosts.length > 1;
                const farther = dist(b) - closest;
                return (
                  <li
                    key={b.booking_id}
                    className={`flex flex-col gap-4 rounded-xl border p-4 ${
                      isClosest ? 'border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20' : 'border-white/10 bg-zinc-950'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-zinc-100">{b.host_name}</h3>
                        <p className="mt-0.5 truncate text-xs text-zinc-400">{b.title}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xl font-semibold leading-none text-emerald-400">{kmLabel(b)}</p>
                        {isClosest ? (
                          <span className="mt-1.5 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">Closest to you</span>
                        ) : (
                          acceptedHosts.length > 1 && Number.isFinite(farther) && (
                            <p className="mt-1.5 text-[11px] text-zinc-500">+{farther.toFixed(2)} km farther</p>
                          )
                        )}
                      </div>
                    </div>

                    <dl className="space-y-2 rounded-lg border border-white/5 bg-zinc-900/60 p-3 text-xs">
                      <div className="flex justify-between gap-3"><dt className="text-zinc-400">Community tariff</dt><dd className="font-semibold text-emerald-400">₹{b.price_per_kwh} / kWh</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-zinc-400">Connector</dt><dd className="font-medium text-teal-300">{b.connector_type} · {b.power_kw} kW</dd></div>
                      <div className="flex items-start justify-between gap-3"><dt className="shrink-0 text-zinc-400">Exact address</dt><dd className="flex min-w-0 items-start gap-1.5 break-words text-right font-medium text-zinc-100"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />{b.unlocked_address}</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-zinc-400">Host phone</dt><dd className="font-medium text-zinc-100">{b.host_phone}</dd></div>
                    </dl>

                    <div className="mt-auto flex gap-2">
                      <a href={`tel:${String(b.host_phone).replace(/\s+/g, '')}`} className={`${btnGhost} flex-1`}>
                        <Phone className="h-4 w-4" aria-hidden="true" /> Call host
                      </a>
                      <a href={mapsLink(b.unlocked_address)} target="_blank" rel="noopener noreferrer" className={`${btnPrimary} flex-1`}>
                        <Navigation className="h-4 w-4" aria-hidden="true" /> Directions
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs text-zinc-500">When you arrive, give your PIN to the host you choose. All your other requests are withdrawn the moment they start your session.</p>
          </section>
        )}


        <ChargerMap
          chargers={shown}
          total={chargers.length}
          origin={DRIVER_LOCATION}
          radiusKm={radius}
          activeId={activeChargerId}
          onHover={setActiveChargerId}
          onSelect={selectCharger}
          query={finderQuery}
          onQuery={setFinderQuery}
          filtersOpen={filtersOpen}
          onToggleFilters={() => setFiltersOpen((v) => !v)}
          filtersPanel={filtersPanel}
          extra={sosActive && <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 backdrop-blur-xl">SOS boost on</span>}
        />

        <section aria-labelledby="chargers-title">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className={eyebrow}>Nearby</p>
              <h2 id="chargers-title" className="mt-1 font-display text-3xl font-semibold tracking-tight text-zinc-100">Chargers near you</h2>
            </div>
            <span className={pill}>{shown.length} shown</span>
          </div>
          {shown.length === 0 ? (
            <div className={`${card} p-8 text-center`}>
              <MapPin className="mx-auto h-8 w-8 text-zinc-500" aria-hidden="true" />
              <h3 className="mt-3 font-display text-xl font-semibold text-zinc-100">{q ? 'No chargers match your search' : 'No chargers in range'}</h3>
              <p className="mt-1 text-sm text-zinc-400">{q ? 'Try a different name or area, or clear the search.' : 'Try a larger radius from Filters, or clear the connector filter.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {shown.map((c) => (
                <ChargerCard
                  key={c.charger_id}
                  c={c}
                  reqStatus={statusByCharger.get(c.charger_id)}
                  active={activeChargerId === c.charger_id}
                  busy={!!busy}
                  loading={busy === 'book-' + c.charger_id}
                  sosActive={sosActive}
                  onHover={setActiveChargerId}
                  onRequest={() => withBusy('book-' + c.charger_id, () => handleBookSlot(c.charger_id, sosActive))}
                />
              ))}
            </div>
          )}
        </section>

        {/* Requests still waiting for a host to answer */}
        <section aria-labelledby="bookings-title" className={`${card} p-5 sm:p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="bookings-title" className="font-display text-2xl font-semibold tracking-tight text-zinc-100">Requests waiting for a host</h2>
            {waiting.length > 0 && <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300"><Hourglass className="h-3 w-3" aria-hidden="true" />{waiting.length} pending</span>}
          </div>
          {waiting.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-400">
              {acceptedHosts.length > 0 || liveSessions.length > 0
                ? 'No other requests are waiting right now.'
                : 'No requests yet. Tap Request Charger on as many nearby hosts as you like. They all share your PIN, and accepted hosts appear above.'}
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {waiting.map((b) => (
                <li key={b.booking_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-zinc-950 p-4 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-100">{b.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">{b.host_name} · {kmLabel(b)} · ₹{b.price_per_kwh}/kWh{Boolean(b.is_sos_emergency) && ' · SOS'}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusCls(b.status)}`}>
                    <Hourglass className="h-3 w-3" aria-hidden="true" />{statusLabel(b.status)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>
    );
  };

  const renderHost = () => {
    if (!token) return renderHome();
    const incomingRequests = hostBookings.filter((b) => b.status === 'REQUESTED');
    const awaitingOtp = hostBookings.filter((b) => b.status === 'APPROVED');
    const liveSessions = hostBookings.filter((b) => b.status === 'CHARGING_ACTIVE');
    const activeHostBookings = [...incomingRequests, ...awaitingOtp, ...liveSessions];

    // Accept -> Verify OTP -> Complete progress marker
    const renderSteps = (current) => (
      <ol aria-label="Session progress" className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px]">
        {['Accept request', 'Verify OTP', 'Complete'].map((label, i) => (
          <li key={label} className={`flex items-center gap-1.5 ${i < current ? 'text-emerald-400' : i === current ? 'font-medium text-zinc-100' : 'text-zinc-600'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${i <= current ? 'bg-emerald-400' : 'bg-zinc-700'}`} aria-hidden="true" />
            {label}
            {i < 2 && <ChevronRight className="h-3 w-3 text-zinc-700" aria-hidden="true" />}
          </li>
        ))}
      </ol>
    );

    const renderRequestRow = (b) => {
      const step = b.status === 'REQUESTED' ? 0 : b.status === 'APPROVED' ? 1 : 2;
      return (
        <li key={b.booking_id} className="flex flex-col gap-4 rounded-xl border border-white/5 bg-zinc-950 p-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-zinc-100">{b.driver_name}</span>
              <span className="font-mono text-xs text-zinc-500">#{b.booking_id}</span>
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusCls(b.status)}`}>{statusLabel(b.status, 'host')}</span>
              {Boolean(b.is_sos_emergency) && <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-300">SOS</span>}
            </div>
            <p className="mt-1 text-xs text-zinc-400">{b.title} · ₹{b.price_per_kwh}/kWh · requested {timeAgo(b.created_at)}</p>
            {renderSteps(step)}
          </div>
          <div className="flex flex-wrap items-center gap-2 md:shrink-0">
            {b.status === 'REQUESTED' && (
              <button type="button" disabled={!!busy} onClick={() => withBusy('approve-' + b.booking_id, () => handleApproveBooking(b.booking_id))} className={btnPrimary}>
                {busy === 'approve-' + b.booking_id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                Accept Request
              </button>
            )}
            {b.status === 'APPROVED' && (
              <>
                <label htmlFor={`otp-${b.booking_id}`} className="sr-only">Driver's 4-digit OTP</label>
                <input id={`otp-${b.booking_id}`} type="text" inputMode="numeric" autoComplete="off" maxLength={4} placeholder="Driver OTP" value={otpInput[b.booking_id] || ''} onChange={(e) => setOtpInput({ ...otpInput, [b.booking_id]: e.target.value.replace(/\D/g, '') })} className={`${inputCls} !w-32 text-center font-mono tracking-widest`} />
                <button type="button" disabled={!!busy} onClick={() => withBusy('otp-' + b.booking_id, () => handleStartSession(b.booking_id))} className={btnPrimary}>
                  {busy === 'otp-' + b.booking_id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <KeyRound className="h-4 w-4" aria-hidden="true" />}
                  Verify &amp; start
                </button>
              </>
            )}
            {b.status === 'CHARGING_ACTIVE' && (
              <>
                <label htmlFor={`units-${b.booking_id}`} className="sr-only">Units consumed in kWh</label>
                <input id={`units-${b.booking_id}`} type="number" min="0" step="0.1" placeholder="Enter kWh" value={unitsInput[b.booking_id] || ''} onChange={(e) => setUnitsInput({ ...unitsInput, [b.booking_id]: e.target.value })} className={`${inputCls} !w-32`} />
                <button type="button" disabled={!!busy} onClick={() => withBusy('complete-' + b.booking_id, () => handleCompleteSession(b.booking_id))} className={btnPrimary}>
                  {busy === 'complete-' + b.booking_id && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  Complete session
                </button>
              </>
            )}
          </div>
        </li>
      );
    };

    const renderQueue = (title, hint, list, tone) => (
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{list.length}</span>
        </div>
        {list.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 px-4 py-3 text-xs text-zinc-500">{hint}</p>
        ) : (
          <ul className="space-y-3">{list.map(renderRequestRow)}</ul>
        )}
      </div>
    );
    const TariffNote = newPrice <= 12 ? Gauge : newPrice < 15 ? Leaf : Zap;
    return (
      <div>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            {renderCrumbs([{ label: 'Host workspace', view: 'host' }, { label: 'Provide a charger' }])}
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">Host console</h1>
            <p className="mt-1.5 text-sm text-zinc-400">List your idle home charger, verify drivers and settle every session.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <section aria-labelledby="list-title" className={`${card} p-5 sm:p-6`}>
            <h2 id="list-title" className="text-lg font-semibold tracking-tight text-zinc-100">List your idle home charger</h2>
            <p className="mt-1 mb-5 text-xs text-zinc-400">Fair-price guardrail: ₹11 to ₹16 per kWh</p>

            <form onSubmit={(e) => withBusy('register', () => handleRegisterCharger(e))} className="space-y-4">
              <div>
                <label htmlFor="h-title" className={labelCls}>Charger listing title</label>
                <input id="h-title" type="text" required placeholder="e.g. 7.2 kW AC wallbox, Block B" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="h-area" className={labelCls}>Area name (shown publicly in search)</label>
                <input id="h-area" type="text" required value={newArea} onChange={(e) => setNewArea(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="h-address" className={labelCls}>Full house address (hidden until you approve)</label>
                <textarea id="h-address" rows={2} required value={newAddress} onChange={(e) => setNewAddress(e.target.value)} className={`${inputCls} py-2`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="h-connector" className={labelCls}>Connector</label>
                  <select id="h-connector" value={newConnector} onChange={(e) => setNewConnector(e.target.value)} className={inputCls}>
                    <option value="15A_Socket">15A Socket</option>
                    <option value="Type2_Wallbox">Type-2 Wallbox</option>
                    <option value="CCS2">CCS2 Fast</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="h-power" className={labelCls}>Power rating (kW)</label>
                  <input id="h-power" type="number" step="0.1" value={newPower} onChange={(e) => setNewPower(e.target.value)} className={inputCls} />
                </div>
              </div>

              {/* Fair-Price Guardrail Slider */}
              <div className="space-y-2 rounded-xl border border-white/10 bg-zinc-950 p-4">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="h-price" className="text-zinc-400">Tariff rate</label>
                  <span className="text-lg font-semibold text-emerald-400">₹{newPrice} / kWh</span>
                </div>
                <input
                  id="h-price"
                  type="range"
                  min="11.00"
                  max="16.00"
                  step="0.5"
                  value={newPrice}
                  onChange={(e) => setNewPrice(parseFloat(e.target.value))}
                  className={`w-full cursor-pointer accent-emerald-500 ${focusRing}`}
                />
                <div className="flex justify-between text-[11px] text-zinc-500">
                  <span>₹11 floor</span>
                  <span>₹13–14 sweet spot</span>
                  <span>₹16 ceiling</span>
                </div>
                <p className="flex items-center gap-1.5 pt-1 text-xs font-medium text-emerald-300">
                  <TariffNote className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {newPrice <= 12 && 'High-demand saver: attracts about 2x more bookings'}
                  {newPrice > 12 && newPrice < 15 && 'Balanced community rate: ₹5–6 profit per unit'}
                  {newPrice >= 15 && 'Fast wallbox premium: maximum allowed cap'}
                </p>
              </div>

              <button type="submit" disabled={busy === 'register'} className={`${btnPrimary} w-full`}>
                {busy === 'register' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Publish charger listing
              </button>
            </form>
          </section>

          <div className="space-y-6 lg:col-span-2">
            <section aria-labelledby="dispatch-title" className={`${card} p-5 sm:p-6`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 id="dispatch-title" className="text-lg font-semibold tracking-tight text-zinc-100">Incoming requests and live sessions</h2>
                  <p className="mt-1 text-sm text-zinc-400">Accept a request, enter the driver's 4-digit OTP when they arrive, then log the kWh delivered. This list refreshes automatically.</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-400">
                  <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" /></span>
                  Live
                </span>
              </div>

              {activeHostBookings.length === 0 ? (
                <p className="mt-5 rounded-xl border border-white/5 bg-zinc-950 p-4 text-sm text-zinc-400">No open requests right now. New driver requests will appear here the moment they are sent.</p>
              ) : (
                <div className="mt-5 space-y-6">
                  {renderQueue('Incoming requests', 'No new requests.', incomingRequests, 'border-amber-500/20 bg-amber-500/10 text-amber-300')}
                  {renderQueue('Accepted: waiting for the driver to arrive', 'Accepted requests wait here. When the driver arrives, ask for their 4-digit Session PIN and enter it.', awaitingOtp, 'border-teal-500/20 bg-teal-500/10 text-teal-300')}
                  {renderQueue('Charging now', 'No active sessions.', liveSessions, 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300')}
                </div>
              )}
            </section>

            {latestBill && (
              <section aria-labelledby="bill-title" className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-5 sm:p-6">
                <h2 id="bill-title" className="flex items-center gap-2 text-base font-semibold text-emerald-400"><Receipt className="h-4 w-4" aria-hidden="true" />Session billing breakdown</h2>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs lg:grid-cols-4">
                  {[
                    ['Units consumed', `${latestBill.units_consumed_kwh} kWh`, 'text-zinc-100'],
                    ['Your net profit', `+₹${latestBill.sharma_uncle_net_profit}`, 'text-emerald-400'],
                    ['EB recovery (@ ₹8)', `₹${latestBill.electricity_bill_recovery}`, 'text-zinc-300'],
                    ['Total paid by driver', `₹${latestBill.driver_total_payable}`, 'text-zinc-100']
                  ].map(([k, v, c]) => (
                    <div key={k} className="rounded-lg border border-white/10 bg-zinc-900/70 p-3">
                      <dt className="text-zinc-400">{k}</dt>
                      <dd className={`mt-1 text-lg font-semibold ${c}`}>{v}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAdmin = () => {
    if (!token) return renderHome();
    if (!isAdmin) return renderStations();
    const stats = [
      ['Completed sessions', analytics?.completed_sessions || 0, 'text-zinc-100', Zap],
      ['Total clean energy', `${analytics?.total_kwh_shared || 0} kWh`, 'text-teal-300', BatteryCharging],
      ['CO2 prevented', `${analytics?.co2_saved_kg || 0} kg`, 'text-emerald-400', Leaf],
      ['Platform fee revenue (10%)', `₹${analytics?.total_platform_revenue || 0}`, 'text-amber-300', Receipt],
      ['Community host payouts', `₹${analytics?.total_host_earnings || 0}`, 'text-emerald-400', IndianRupee]
    ];
    return (
      <div>
        {renderCrumbs([{ label: 'Admin control', view: 'admin' }, { label: 'Platform health & ESG' }])}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">Admin control & ESG impact</h1>
            <p className="mt-1.5 text-sm text-zinc-400">Live platform analytics aggregated from MySQL charging logs.</p>
          </div>
          <button type="button" disabled={busy === 'refresh'} onClick={() => withBusy('refresh', fetchAdminAnalytics)} className={btnGhost}>
            <RefreshCw className={`h-4 w-4 ${busy === 'refresh' ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh metrics
          </button>
        </div>
        <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {stats.map(([label, value, color, Icon]) => (
            <article key={label} className={`${card} p-5`}>
              <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                <h2 className="font-medium">{label}</h2>
                <Icon className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
              </div>
              <p className={`mt-3 break-words text-2xl font-semibold tracking-tight ${color}`}>{value}</p>
            </article>
          ))}
        </section>
      </div>
    );
  };

  // "29 Oct 2026, 06:47 pm" in the viewer's local time
  const fmtDate = (d) => {
    if (!d) return '—';
    const t = new Date(d);
    if (Number.isNaN(t.getTime())) return String(d);
    const date = t.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
    return `${date}, ${time}`;
  };
  const money = (n) => `₹${(Number(n) || 0).toFixed(2)}`;
  const timeAgo = (d) => {
    const t = new Date(d).getTime();
    if (!t) return '';
    const m = Math.max(0, Math.round((Date.now() - t) / 60000));
    return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
  };

  const renderHistory = () => {
    if (!token) return renderHome();
    if (isAdmin) return renderAdmin();

    const th = 'whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-zinc-500';
    const td = 'px-3 py-3 align-top text-sm text-zinc-300';

    if (isHost) {
      const done = hostBookings.filter((b) => b.status === 'COMPLETED');
      const rows = done.map((b) => {
        const units = Number(b.units_consumed_kwh) || 0;
        const eb = units * 8; // ₹8/kWh domestic electricity baseline (same as backend billing)
        const payout = Number(b.host_payout) || 0;
        return { ...b, units, eb, payout, profit: payout - eb };
      });
      const totalProfit = rows.reduce((t, r) => t + r.profit, 0);
      const totalEb = rows.reduce((t, r) => t + r.eb, 0);
      const totalPayout = rows.reduce((t, r) => t + r.payout, 0);
      const usersServed = new Set(hostBookings.filter((b) => ['CHARGING_ACTIVE', 'COMPLETED'].includes(b.status)).map((b) => b.driver_id)).size;
      const stats = [
        ['Total profit earned', money(totalProfit), 'text-emerald-400', IndianRupee],
        ['Electricity bill recovered', money(totalEb), 'text-teal-300', Receipt],
        ['Users who charged', usersServed, 'text-zinc-100', Users],
        ['Completed sessions', rows.length, 'text-zinc-100', Zap]
      ];
      return (
        <div className="space-y-8">
          <div>
            {renderCrumbs([{ label: 'Host workspace', view: 'host' }, { label: 'History' }])}
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">Host history</h1>
            <p className="mt-1.5 text-sm text-zinc-400">Earnings, bill recovery and every session on your chargers. Total payout received: <span className="font-medium text-zinc-200">{money(totalPayout)}</span>.</p>
          </div>
          <section aria-label="Host summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(([label, value, color, Icon]) => (
              <article key={label} className={`${card} p-5`}>
                <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                  <h2 className="font-medium">{label}</h2>
                  <Icon className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
                </div>
                <p className={`mt-3 break-words text-2xl font-semibold tracking-tight ${color}`}>{value}</p>
              </article>
            ))}
          </section>
          <section aria-labelledby="host-records-title" className={`${card} p-5 sm:p-6`}>
            <h2 id="host-records-title" className="text-lg font-semibold tracking-tight text-zinc-100">Session records</h2>
            {hostBookings.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-400">No sessions yet. Bookings on your chargers will be listed here.</p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-xl border border-white/5 bg-zinc-950">
                <table className="min-w-full divide-y divide-white/5">
                  <thead>
                    <tr>{['Booking', 'Driver', 'Charger', 'Date & time', 'Status', 'kWh', 'EB recovery', 'Profit', 'Payout'].map((h) => <th key={h} scope="col" className={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {hostBookings.map((b) => {
                      const units = Number(b.units_consumed_kwh) || 0;
                      const isDone = b.status === 'COMPLETED';
                      const payout = Number(b.host_payout) || 0;
                      return (
                        <tr key={b.booking_id}>
                          <td className={`${td} font-mono`}>#{b.booking_id}</td>
                          <td className={`${td} font-medium text-zinc-100`}>{b.driver_name}</td>
                          <td className={td}>{b.title}<span className="block text-xs text-zinc-500">{b.area_name}</span></td>
                          <td className={`${td} whitespace-nowrap`}>{fmtDate(isDone ? b.actual_end_time || b.created_at : b.created_at)}<span className="block text-xs text-zinc-500">{isDone ? 'Completed' : 'Requested'}</span></td>
                          <td className={td}><span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusCls(b.status)}`}>{b.status}</span></td>
                          <td className={td}>{isDone ? units : '—'}</td>
                          <td className={td}>{isDone ? money(units * 8) : '—'}</td>
                          <td className={`${td} font-medium text-emerald-400`}>{isDone ? `+${money(payout - units * 8)}` : '—'}</td>
                          <td className={td}>{isDone ? money(payout) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      );
    }

    // History only lists chargers the driver actually connected to (unfulfilled requests are auto-cleaned by the backend)
    const connected = myBookings.filter((b) => b.status === 'CHARGING_ACTIVE' || b.status === 'COMPLETED');
    const [, rangeDays] = HISTORY_RANGES[historyRange] || HISTORY_RANGES['6m'];
    const cutoff = Number.isFinite(rangeDays) ? Date.now() - rangeDays * 86400000 : 0;
    const inRange = connected.filter((b) => new Date(b.actual_end_time || b.created_at).getTime() >= cutoff);
    const completed = inRange.filter((b) => b.status === 'COMPLETED').length;
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className={eyebrow}>User workspace</p>
            <h1 className={`${h1Cls} mt-2`}>Charging history</h1>
            <p className="mt-3 text-sm text-zinc-400">{inRange.length} charging session{inRange.length === 1 ? '' : 's'} in total, {completed} completed.</p>
          </div>
          <div className="relative">
            <label htmlFor="history-range" className="sr-only">Date range</label>
            <select
              id="history-range"
              value={historyRange}
              onChange={(e) => setHistoryRange(e.target.value)}
              className={`vs-card min-h-[48px] appearance-none rounded-full border border-white/10 bg-zinc-900/70 py-2 pl-5 pr-11 text-sm font-medium text-zinc-100 outline-none backdrop-blur-xl focus-visible:ring-2 focus-visible:ring-emerald-500`}
            >
              {Object.entries(HISTORY_RANGES).map(([id, [label]]) => <option key={id} value={id}>{label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
          </div>
        </div>

        {inRange.length === 0 ? (
          <div className={`${card} p-8 text-center`}>
            <h2 className="font-display text-xl font-semibold text-zinc-100">{connected.length === 0 ? 'No charging sessions yet' : 'No sessions in this period'}</h2>
            <p className="mt-1.5 text-sm text-zinc-400">
              {connected.length === 0
                ? 'Request a charger from Find Charge. The one you connect to will show up here.'
                : 'Pick a longer range, such as All time, to see your earlier sessions.'}
            </p>
          </div>
        ) : (
          <HistoryRows sessions={inRange} />
        )}
      </div>
    );
  };

  const renderContact = () => (
    <div>
      <p className={eyebrow}>Support</p>
      <h1 className={`${h1Cls} mt-2`}>Contact support</h1>
      <p className="mt-3 mb-8 max-w-2xl text-sm text-zinc-400">Problem with a booking, a charger or your account? Include the station ID and we will reply within one working day.</p>

      <div className="grid gap-6 lg:grid-cols-3">
        <aside className="space-y-4" aria-label="Contact details">
          <div className={`${card} p-5`}>
            <Phone className="h-5 w-5 text-emerald-400" aria-hidden="true" />
            <h2 className="mt-3 text-sm font-semibold text-zinc-100">Call us</h2>
            <a href={CONTACT_PHONE_HREF} className={`mt-1 inline-block rounded text-sm text-zinc-300 hover:text-emerald-400 ${focusRing}`}>{CONTACT_PHONE_DISPLAY}</a>
            <p className="mt-1 text-xs text-zinc-500">Daily, 8 am to 8 pm IST. SOS charging issues are answered first.</p>
          </div>
          <div className={`${card} p-5`}>
            <Mail className="h-5 w-5 text-emerald-400" aria-hidden="true" />
            <h2 className="mt-3 text-sm font-semibold text-zinc-100">Email us</h2>
            <a href={`mailto:${CONTACT_EMAIL}`} className={`mt-1 inline-block break-all rounded text-sm text-zinc-300 hover:text-emerald-400 ${focusRing}`}>{CONTACT_EMAIL}</a>
          </div>
        </aside>

        <section aria-labelledby="contact-form-title" className={`${card} p-5 sm:p-6 lg:col-span-2`}>
          <h2 id="contact-form-title" className="text-lg font-semibold tracking-tight text-zinc-100">Send a message</h2>
          <form onSubmit={handleContactSubmit} noValidate className="mt-5 space-y-4">
            {cStatus.text && <InlineAlert type={cStatus.type}>{cStatus.text}</InlineAlert>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="c-name" className={labelCls}>Name</label>
                <input id="c-name" type="text" autoComplete="name" aria-invalid={!!cErrors.name} aria-describedby={cErrors.name ? 'c-name-err' : undefined} value={cName} onChange={(e) => setCName(e.target.value)} className={inputCls} />
                {cErrors.name && <p id="c-name-err" className="mt-1 text-xs text-rose-300">{cErrors.name}</p>}
              </div>
              <div>
                <label htmlFor="c-email" className={labelCls}>Email</label>
                <input id="c-email" type="email" autoComplete="email" aria-invalid={!!cErrors.email} aria-describedby={cErrors.email ? 'c-email-err' : undefined} value={cEmail} onChange={(e) => setCEmail(e.target.value)} className={inputCls} />
                {cErrors.email && <p id="c-email-err" className="mt-1 text-xs text-rose-300">{cErrors.email}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="c-subject" className={labelCls}>Subject or station ID</label>
              <input id="c-subject" type="text" placeholder="e.g. Booking #2, Green Park wallbox" aria-invalid={!!cErrors.subject} aria-describedby={cErrors.subject ? 'c-subject-err' : undefined} value={cSubject} onChange={(e) => setCSubject(e.target.value)} className={inputCls} />
              {cErrors.subject && <p id="c-subject-err" className="mt-1 text-xs text-rose-300">{cErrors.subject}</p>}
            </div>
            <div>
              <label htmlFor="c-message" className={labelCls}>Message</label>
              <textarea id="c-message" rows={5} aria-invalid={!!cErrors.message} aria-describedby={cErrors.message ? 'c-message-err' : undefined} value={cMessage} onChange={(e) => setCMessage(e.target.value)} className={`${inputCls} py-2`} />
              {cErrors.message && <p id="c-message-err" className="mt-1 text-xs text-rose-300">{cErrors.message}</p>}
            </div>
            <button type="submit" disabled={busy === 'contact'} className={btnPrimary}>
              {busy === 'contact' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
              {busy === 'contact' ? 'Sending…' : 'Send message'}
            </button>
          </form>
        </section>
      </div>
      <FaqSection />
    </div>
  );

  const renderPrivacy = () => (
    <div className="mx-auto max-w-3xl">
      {renderCrumbs([{ label: token ? 'Workspace' : 'Home', view: token ? homeView : 'home' }, { label: 'Privacy policy' }])}
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">Privacy policy</h1>
      <p className="mt-1.5 text-sm text-zinc-500">Last updated: October 2026</p>
      <div className="mt-8 space-y-8 text-sm leading-relaxed text-zinc-400">
        {[
          ['What we collect', 'Account details (name, email, phone), booking and charging-session records, and the approximate location you search from. When you list a charger, you also provide a full address and connector specifications.'],
          ['How host addresses stay private', 'Search results show only the area name. A host\'s full address is released to a driver only after the host approves that driver\'s booking, and only for that booking.'],
          ['How we use your data', 'To match drivers with chargers, verify sessions with start OTPs, calculate fair-price bills, prevent misuse, and report aggregated, anonymous energy and CO2 figures.'],
          ['Sharing', 'We do not sell personal data. We share it only with the other party to a booking when needed, with service providers that run the platform, or when the law requires it.'],
          ['Your choices', 'You can log out at any time, which clears your session from this device. To access, correct or delete your data, contact us using the details below.']
        ].map(([t, d]) => (
          <section key={t}>
            <h2 className="mb-2 text-lg font-semibold tracking-tight text-zinc-100">{t}</h2>
            <p>{d}</p>
          </section>
        ))}
        <section>
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-zinc-100">Contact</h2>
          <p>
            Email <a href={`mailto:${CONTACT_EMAIL}`} className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300">{CONTACT_EMAIL}</a> or call{' '}
            <a href={CONTACT_PHONE_HREF} className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300">{CONTACT_PHONE_DISPLAY}</a>.
          </p>
        </section>
      </div>
    </div>
  );

  const renderNotFound = () => (
    <div className="mx-auto max-w-lg py-16 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
        <Plug className="h-7 w-7" aria-hidden="true" />
      </span>
      <p className="mt-6 text-sm font-medium text-emerald-400">Error 404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">Station not found</h1>
      <p className="mt-3 text-sm text-zinc-400">This route is offline. The page may have moved, or the link may be mistyped.</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => navigate(token ? homeView : 'home')} className={btnPrimary}>Back to dashboard</button>
      </div>
    </div>
  );

  const renderMemberHome = () => (
    <MemberHome
      cta={isAdmin ? 'Open Dashboard' : isHost ? 'Open Host Workspace' : 'Explore Chargers'}
      onPrimary={() => navigate(homeView)}
      onAbout={() => navigate('about')}
    />
  );

  const renderAbout = () => (
    <AboutPage
      ctaLabel={isAdmin ? 'Open Dashboard' : isHost ? 'Open Host Workspace' : 'Explore Chargers'}
      onExplore={() => navigate(token ? homeView : 'home')}
      phone={CONTACT_PHONE_DISPLAY}
      phoneHref={CONTACT_PHONE_HREF}
      email={CONTACT_EMAIL}
    />
  );

  const views = { home: () => (token ? renderMemberHome() : renderHome()), about: renderAbout, stations: renderStations, host: renderHost, admin: renderAdmin, history: renderHistory, contact: renderContact, privacy: renderPrivacy, notfound: renderNotFound };
  const showLanding = !token && view === 'home';
  const showHost = !!token && isHost && view !== 'privacy'; // hosts get the Host workspace shell (privacy page uses the normal one)
  const ToastIcon = banner.type === 'error' ? AlertCircle : banner.type === 'success' ? CheckCircle2 : Info;

  return (
    <div data-theme={showLanding ? undefined : theme} data-vs-bg={token && !showHost ? view : undefined} className={showHost ? `relative min-h-screen overflow-x-hidden font-sans antialiased ${themeSwitching ? 'theme-switching' : ''}` : showLanding ? 'relative min-h-screen overflow-x-hidden bg-[#FAF7F2] font-sans text-[#0F172A] antialiased' : `vs-root relative flex min-h-screen flex-col overflow-x-hidden bg-zinc-950 font-sans text-zinc-100 antialiased transition-colors duration-300 ${themeSwitching ? 'theme-switching' : ''}`}>
      {/* Ambient glow */}
      {!(showLanding || showHost) && (
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[480px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(16,185,129,0.10),transparent)]" aria-hidden="true" />
      )}

      {/* Header — hidden on the logged-out landing page (it has its own header) */}
      {!(showLanding || showHost) && (
      <>
      <header className={`fixed inset-x-0 top-0 z-50 w-full border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ${scrolled || mobileOpen ? 'border-white/10 bg-zinc-900/70 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-[14px]' : 'border-transparent bg-transparent'}`}>
        <div className={`${wrap} flex h-[72px] items-center justify-between gap-4`}>
          <button
            type="button"
            onClick={() => navigate('home')}
            aria-label="VoltShare home"
            className={`flex items-center gap-2.5 rounded-xl ${focusRing}`}
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-snow shadow-md shadow-emerald-950/20">
              <Zap className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-display text-2xl font-semibold tracking-tight text-zinc-100">VoltShare</span>
          </button>

          {/* Top Navigation Tabs: Rendered ONLY when authenticated */}
          {token && (
            <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
              {AUTH_NAV.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  aria-current={view === n.id ? 'page' : undefined}
                  onClick={() => navigate(n.id)}
                  className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${focusRing} ${
                    view === n.id ? 'text-emerald-400' : 'text-zinc-300 hover:bg-white/5 hover:text-zinc-100'
                  }`}
                >
                  {n.label}
                  <span className={`absolute inset-x-0 -bottom-0.5 mx-auto h-1 w-1 rounded-full bg-emerald-600 transition-opacity ${view === n.id ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />
                </button>
              ))}
            </nav>
          )}

          {token && (
            <div className="flex items-center gap-2">
              <div ref={profileRef} className="relative hidden lg:block">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                  onClick={() => setProfileOpen((v) => !v)}
                  className={`vs-card flex max-w-[16rem] items-center gap-2.5 rounded-full border border-white/10 bg-zinc-900/60 py-1.5 pl-1.5 pr-3.5 text-sm backdrop-blur-xl transition-colors hover:border-emerald-500/30 ${focusRing}`}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-600 text-snow">
                    <User className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <strong className="min-w-0 truncate text-[13px] font-semibold text-zinc-100">{currentUser?.full_name || 'Member'}</strong>
                  <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {profileOpen && (
                  <div role="menu" aria-label="Profile menu" className="absolute right-0 top-full z-50 mt-3 w-72 rounded-3xl border border-white/10 bg-zinc-900/[0.97] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.14)]">
                    <div className="flex items-center gap-3 px-3 py-3">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-600 text-snow"><User className="h-6 w-6" aria-hidden="true" /></span>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-zinc-100">{currentUser?.full_name || 'Member'}</p>
                        <p className="text-xs text-zinc-400">{roleLabel} account</p>
                      </div>
                    </div>
                    <div className="mx-2 border-t border-white/10" />
                    <div className="py-1.5">
                      <button type="button" role="menuitem" onClick={openProfile} className={menuItem}>
                        <User className="h-[18px] w-[18px] text-emerald-400" aria-hidden="true" />
                        Profile
                      </button>
                      <button type="button" role="menuitem" onClick={() => { setProfileOpen(false); navigate(homeView); }} className={menuItem}>
                        <LayoutDashboard className="h-[18px] w-[18px] text-emerald-400" aria-hidden="true" />
                        {isAdmin ? 'Dashboard' : isHost ? 'Host Workspace' : 'User Workspace'}
                      </button>
                      {!isAdmin && (
                        <button type="button" role="menuitem" onClick={() => { setProfileOpen(false); navigate('history'); }} className={menuItem}>
                          <HistoryIcon className="h-[18px] w-[18px] text-emerald-400" aria-hidden="true" />
                          History
                        </button>
                      )}
                    </div>
                    <div className="mx-2 border-t border-white/10" />
                    <div className="flex min-h-[52px] items-center justify-between gap-3 px-3 py-2">
                      <span className="flex items-center gap-3 text-sm text-zinc-300">
                        {theme === 'dark' ? <Moon className="h-[18px] w-[18px] text-emerald-400" aria-hidden="true" /> : <Sun className="h-[18px] w-[18px] text-emerald-400" aria-hidden="true" />}
                        Theme
                      </span>
                      <div role="group" aria-label="Theme" className="flex rounded-full border border-white/10 bg-zinc-950 p-0.5">
                        {[['light', 'Light'], ['dark', 'Dark']].map(([id, label]) => (
                          <button
                            key={id}
                            type="button"
                            role="menuitemradio"
                            aria-checked={theme === id}
                            onClick={() => changeTheme(id)}
                            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${focusRing} ${theme === id ? 'bg-emerald-600 text-snow shadow' : 'text-zinc-400 hover:text-zinc-100'}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mx-2 border-t border-white/10" />
                    <div className="pt-1.5">
                      <button type="button" role="menuitem" onClick={logout} className={`${menuItem} font-medium !text-rose-400 hover:!bg-rose-500/10`}>
                        <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
                onClick={() => setMobileOpen(!mobileOpen)}
                className={`${btnGhost} h-11 w-11 rounded-full px-0 lg:hidden`}
              >
                {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
              </button>
            </div>
          )}
        </div>

        {/* Mobile drawer + backdrop (Only when authenticated) */}
        {token && mobileOpen && (
          <div className="lg:hidden">
            <button type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 top-[72px] z-40 bg-black/40 backdrop-blur-sm" />
            <div id="mobile-menu" className="absolute inset-x-0 top-[72px] z-50 max-h-[calc(100vh-72px)] overflow-y-auto border-b border-white/10 bg-zinc-900 p-4 shadow-2xl">
              <nav aria-label="Mobile" className="grid gap-1">
                {AUTH_NAV.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    aria-current={view === n.id ? 'page' : undefined}
                    onClick={() => navigate(n.id)}
                    className={`flex min-h-[48px] items-center justify-between rounded-2xl px-4 text-left text-sm font-medium ${focusRing} ${
                      view === n.id ? 'bg-emerald-500/15 text-emerald-400' : 'text-zinc-300 hover:bg-white/5'
                    }`}
                  >
                    {n.label}
                    <ChevronRight className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                  </button>
                ))}
              </nav>
              <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                <button type="button" onClick={openProfile} className={`${menuItem} border border-white/10 bg-white/5`}>
                  <User className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">Profile · {currentUser?.full_name || 'Member'}</span>
                  <span className="text-xs text-zinc-500">{roleLabel}</span>
                </button>
                <div className="flex items-center justify-between gap-3 px-1">
                  <span className="flex items-center gap-2.5 text-sm text-zinc-300"><Palette className="h-4 w-4 text-emerald-400" aria-hidden="true" />Theme</span>
                  <div role="group" aria-label="Theme" className="flex rounded-full border border-white/10 bg-zinc-950 p-0.5">
                    {[['light', 'Light', Sun], ['dark', 'Dark', Moon]].map(([id, label, Icon]) => (
                      <button key={id} type="button" aria-pressed={theme === id} onClick={() => changeTheme(id)} className={`flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-colors ${focusRing} ${theme === id ? 'bg-emerald-600 text-snow' : 'text-zinc-400 hover:text-zinc-100'}`}>
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />{label}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={() => { logout(); setMobileOpen(false); }} className={`${btnGhost} w-full !text-rose-400`}>
                  <LogOut className="h-4 w-4" aria-hidden="true" /> Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
      <div className="h-[72px] shrink-0" aria-hidden="true" />
      </>
      )}

      {/* Toast notifications */}
      {banner.text && (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex justify-center px-4 sm:justify-end sm:px-6">
          <div
            role={banner.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-3.5 text-sm shadow-2xl backdrop-blur-md ${
              banner.type === 'error'
                ? 'border-rose-500/30 bg-rose-950/80 text-rose-200'
                : banner.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-950/80 text-emerald-200'
                : 'border-sky-500/30 bg-sky-950/80 text-sky-200'
            }`}
          >
            <ToastIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 break-words">{banner.text}</span>
            <button type="button" aria-label="Dismiss notification" onClick={() => setBanner({ text: '', type: '' })} className={`rounded p-0.5 opacity-70 hover:opacity-100 ${focusRing}`}>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Main workspace */}
      {showLanding ? (
        <Landing
          onLogin={() => { setIsRegistering(false); setAuthOpen(true); }}
          onSignup={() => { setIsRegistering(true); setAuthOpen(true); }}
          onPrivacy={() => navigate('privacy')}
          contact={{
            name: cName, setName: setCName, email: cEmail, setEmail: setCEmail,
            subject: cSubject, setSubject: setCSubject, message: cMessage, setMessage: setCMessage,
            errors: cErrors, status: cStatus, busy: busy === 'contact', onSubmit: handleContactSubmit
          }}
        />
      ) : showHost ? (
        <HostWorkspace
          ctx={{
            user: currentUser, logout, theme, changeTheme, onProfile: openProfile, view,
            footer: { phoneDisplay: CONTACT_PHONE_DISPLAY, phoneHref: CONTACT_PHONE_HREF, email: CONTACT_EMAIL, privacyHref: ROUTES.privacy, onPrivacy: () => navigate('privacy') },
            initialTab: view === 'history' ? 'history' : view === 'contact' ? 'support' : 'home',
            hostBookings, latestBill, otpInput, setOtpInput, unitsInput, setUnitsInput, busy,
            onApprove: (id) => withBusy('approve-' + id, () => handleApproveBooking(id)),
            onStart: (id) => withBusy('otp-' + id, () => handleStartSession(id)),
            onComplete: (id) => withBusy('complete-' + id, () => handleCompleteSession(id)),
            charger: {
              title: newTitle, setTitle: setNewTitle, area: newArea, setArea: setNewArea, address: newAddress, setAddress: setNewAddress,
              connector: newConnector, setConnector: setNewConnector, power: newPower, setPower: setNewPower, price: newPrice, setPrice: setNewPrice,
              onSubmit: (e) => withBusy('register', () => handleRegisterCharger(e))
            },
            contact: {
              name: cName, setName: setCName, email: cEmail, setEmail: setCEmail, subject: cSubject, setSubject: setCSubject,
              message: cMessage, setMessage: setCMessage, errors: cErrors, status: cStatus, busy: busy === 'contact', onSubmit: handleContactSubmit
            }
          }}
        />
      ) : (
        <main className={`${wrap} relative z-10 flex-1 py-10 sm:py-14`}>
          {(views[view] || renderNotFound)()}
        </main>
      )}

      {/* Log In / Sign Up modal (landing page) */}
      {showLanding && authOpen && (
        <div className="fixed inset-0 z-[55] flex overflow-y-auto bg-black/60 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setAuthOpen(false); }}>
          <div role="dialog" aria-modal="true" aria-label={isRegistering ? 'Create account' : 'Sign in'} className="relative m-auto w-full max-w-md">
            <button type="button" aria-label="Close" onClick={() => setAuthOpen(false)} className="absolute -right-2 -top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-white text-slate-900 shadow-lg transition hover:bg-slate-100">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="rounded-2xl bg-zinc-950 text-zinc-100 shadow-2xl">{renderAuthCard()}</div>
          </div>
        </div>
      )}

      {/* Profile editor */}
      {!showLanding && token && profileModalOpen && (
        <div className="fixed inset-0 z-[70] flex overflow-y-auto bg-black/50 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setProfileModalOpen(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="profile-title" className="relative m-auto w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl shadow-black/40 sm:p-7">
            <button type="button" aria-label="Close profile" onClick={() => setProfileModalOpen(false)} className={`absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100 ${focusRing}`}>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-3.5 pr-10">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-base font-semibold text-emerald-400" aria-hidden="true">
                {(profileForm.full_name || currentUser?.full_name || 'M').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
              </span>
              <div className="min-w-0">
                <h2 id="profile-title" className="text-lg font-semibold tracking-tight text-zinc-100">Your profile</h2>
                <p className="text-xs text-zinc-400">{roleLabel} account</p>
              </div>
            </div>

            <form onSubmit={saveProfile} noValidate className="mt-6 space-y-5">
              <div>
                <label htmlFor="profile-name" className={labelCls}>Name <span className="text-rose-400" aria-hidden="true">*</span><span className="sr-only">(required)</span></label>
                <input
                  id="profile-name"
                  type="text"
                  autoFocus
                  autoComplete="name"
                  maxLength={100}
                  required
                  aria-required="true"
                  aria-invalid={profileError ? 'true' : undefined}
                  aria-describedby={profileError ? 'profile-error' : undefined}
                  disabled={profileLoading}
                  value={profileForm.full_name}
                  onChange={(e) => { setProfileForm({ ...profileForm, full_name: e.target.value }); if (profileError) setProfileError(''); }}
                  className={inputCls}
                />
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <label htmlFor="profile-description" className={labelCls}>Description <span className="font-normal text-zinc-500">(optional)</span></label>
                  <span className="text-[11px] text-zinc-500" aria-hidden="true">{profileForm.description.length}/500</span>
                </div>
                <textarea
                  id="profile-description"
                  rows={4}
                  maxLength={500}
                  disabled={profileLoading}
                  placeholder="A line or two about you, your EV or your home charger"
                  value={profileForm.description}
                  onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                  className={`${inputCls} resize-none py-2.5 leading-relaxed`}
                />
              </div>

              {(profileMeta.email || profileMeta.phone) && (
                <dl className="space-y-2 rounded-xl border border-white/5 bg-zinc-950 p-3.5 text-xs">
                  {profileMeta.email && <div className="flex justify-between gap-3"><dt className="text-zinc-400">Email</dt><dd className="break-all text-right font-medium text-zinc-200">{profileMeta.email}</dd></div>}
                  {profileMeta.phone && <div className="flex justify-between gap-3"><dt className="text-zinc-400">Phone</dt><dd className="font-medium text-zinc-200">{profileMeta.phone}</dd></div>}
                </dl>
              )}

              {profileError && <p id="profile-error" role="alert" className="flex items-center gap-1.5 text-sm text-rose-400"><AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />{profileError}</p>}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setProfileModalOpen(false)} className={btnGhost}>Cancel</button>
                <button type="submit" disabled={profileSaving || profileLoading} className={btnPrimary}>
                  {profileSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer (also shown under the Host workspace) */}
      {!showLanding && !showHost && (
      <footer className="relative z-10 border-t border-white/10 bg-zinc-950">
        <div className={`${wrap} grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-3`}>
          <div>
            <div className="flex items-center gap-2 text-zinc-100">
              <Zap className="h-5 w-5 text-emerald-400" aria-hidden="true" />
              <span className="font-semibold tracking-tight">VoltShare</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-zinc-400">Community EV charging and fair-price energy sharing between neighbours.</p>
          </div>
          <nav aria-label="Legal & Support">
            <h2 className="text-sm font-semibold text-zinc-100">Legal & Support</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              <li>{link('privacy', 'Privacy policy', 'hover:text-zinc-100')}</li>
              {token && <li>{link('contact', 'Support form', 'hover:text-zinc-100')}</li>}
            </ul>
          </nav>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Contact</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              <li><a href={CONTACT_PHONE_HREF} className={`inline-flex items-center gap-2 rounded hover:text-zinc-100 ${focusRing}`}><Phone className="h-4 w-4" aria-hidden="true" />{CONTACT_PHONE_DISPLAY}</a></li>
              <li><a href={`mailto:${CONTACT_EMAIL}`} className={`inline-flex items-center gap-2 break-all rounded hover:text-zinc-100 ${focusRing}`}><Mail className="h-4 w-4 shrink-0" aria-hidden="true" />{CONTACT_EMAIL}</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5">
          <p className={`${wrap} py-5 text-xs text-zinc-500`}>© {new Date().getFullYear()} VoltShare. All rights reserved.</p>
        </div>
      </footer>
      )}
    </div>
  );
}