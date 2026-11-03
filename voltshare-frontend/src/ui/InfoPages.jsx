import { ShieldCheck, IndianRupee, KeyRound, Plug, Phone, Mail, ArrowRight, Leaf } from 'lucide-react';
import Accordion from './Accordion.jsx';
import { card, eyebrow, btnPill, focusRing } from './tokens.js';

// Every answer below describes behaviour that exists in the app today
const FAQS = [
  ['How does my 4-digit charging PIN work?', 'You get one PIN each time you sign in and it is shown at the top of Find Charge. Every request you send shares that same PIN. When you reach your chosen host, tell them the PIN. They enter it to start your session.'],
  ['Why can I not see the host\'s exact address?', 'Search shows only the area name to keep hosts\' homes private. The full address and phone number unlock the moment a host accepts your request.'],
  ['Can I ask several hosts at once?', 'Yes. Send a request to as many nearby hosts as you like, one request per host. Hosts who accept appear under "Accepted Hosts - Ready to Drive", sorted by distance, so you can pick the closest.'],
  ['What happens to my other requests when I start charging?', 'As soon as a host verifies your PIN, your other open requests are withdrawn automatically. Those hosts stop seeing them, and your history shows only the charger you used.'],
  ['How much will charging cost?', 'Hosts set a tariff between ₹11 and ₹16 per kWh. There is no surge pricing. When you finish, your host logs the kWh from the meter and you receive a clear bill.'],
  ['What does the SOS Emergency Boost do?', 'It limits results to chargers available right now and flags your requests as an emergency so hosts can see they are urgent. Use it when your battery is nearly empty.'],
  ['How do I end a charging session?', 'Your host ends it by entering the kWh delivered. Use the Stop Session button on the live monitor to call your host and wrap up.']
];

const STEPS = [
  ['Find or host', 'Sign in as a User to search chargers within 1 to 10 km, or as a Host to list your own home charger.'],
  ['Request and accept', 'Request as many hosts as you like with one PIN. Hosts accept, and their address and phone unlock for you.'],
  ['Charge and settle', 'Give your PIN to the host you choose. They start the session, log the kWh delivered and settle a clear bill.']
];

const CONNECTORS = [
  ['15A Socket', '2W / 3W', 'About 2 to 3.3 kW', 'A standard wall socket for scooters and e-rickshaws.'],
  ['Type 2 Wallbox', 'AC', '7.2 to 11 kW', 'The common home wallbox for most electric cars.'],
  ['CCS2', 'DC fast', 'Fastest option', 'Rapid charging for long trips.']
];

export function AboutPage({ onExplore, ctaLabel = 'Explore Chargers', phone, phoneHref, email }) {
  return (
    <div className="space-y-16">
      <header className="max-w-3xl">
        <p className={eyebrow}>About VoltShare</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-zinc-100 sm:text-6xl">People. Power.<br />A cleaner tomorrow.</h1>
        <p className="mt-5 text-base leading-relaxed text-zinc-400 sm:text-lg">VoltShare connects EV drivers with idle home chargers in their own neighbourhood. Drivers get a fair, capped price and a charger close by. Hosts earn from capacity that would otherwise sit unused, and the whole community moves to cleaner energy.</p>
        <button type="button" onClick={onExplore} className={`${btnPill} mt-7`}>{ctaLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
      </header>

      <section aria-labelledby="doc-how">
        <h2 id="doc-how" className="font-display text-3xl font-semibold tracking-tight text-zinc-100">How a session works</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map(([t, d], i) => (
            <li key={t} className={`${card} p-6`}>
              <span className="font-display text-4xl font-semibold text-emerald-500/40">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-3 font-display text-xl font-semibold text-zinc-100">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="doc-trust">
        <h2 id="doc-trust" className="font-display text-3xl font-semibold tracking-tight text-zinc-100">Platform guarantees</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            [ShieldCheck, 'Private by default', 'Only the area name is public. A host\'s full address and phone unlock after they accept.'],
            [IndianRupee, 'Fair, capped tariffs', 'Rates stay between ₹11 and ₹16 per kWh, set by the host within that range.'],
            [KeyRound, 'PIN-verified sessions', 'A session only starts when the host enters the driver\'s 4-digit PIN in person.']
          ].map(([Icon, t, d]) => (
            <article key={t} className={`${card} p-6`}>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <h3 className="mt-4 font-display text-xl font-semibold text-zinc-100">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="doc-conn">
        <h2 id="doc-conn" className="font-display text-3xl font-semibold tracking-tight text-zinc-100">Connector guide</h2>
        <div className={`${card} mt-8 overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <caption className="sr-only">Supported connectors, typical speeds and use</caption>
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-zinc-500">
                  {['Connector', 'Type', 'Typical speed', 'Best for'].map((h) => <th key={h} scope="col" className="whitespace-nowrap px-5 py-3 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {CONNECTORS.map(([n, t, s, u]) => (
                  <tr key={n}>
                    <th scope="row" className="whitespace-nowrap px-5 py-4 font-semibold text-zinc-100"><span className="inline-flex items-center gap-2"><Plug className="h-4 w-4 text-emerald-400" aria-hidden="true" />{n}</span></th>
                    <td className="whitespace-nowrap px-5 py-4 text-teal-300">{t}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-zinc-300">{s}</td>
                    <td className="min-w-[16rem] px-5 py-4 text-zinc-400">{u}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section aria-labelledby="doc-contact" className={`${card} flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8`}>
        <div>
          <h2 id="doc-contact" className="font-display text-2xl font-semibold tracking-tight text-zinc-100">Questions? We are here.</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400"><Leaf className="h-4 w-4 text-emerald-400" aria-hidden="true" />Replies within one working day, SOS issues first.</p>
        </div>
        <div className="flex flex-col gap-2 text-sm sm:items-end">
          <a href={phoneHref} className={`inline-flex items-center gap-2 rounded text-zinc-200 hover:text-emerald-400 ${focusRing}`}><Phone className="h-4 w-4 text-emerald-400" aria-hidden="true" />{phone}</a>
          <a href={`mailto:${email}`} className={`inline-flex items-center gap-2 rounded text-zinc-200 hover:text-emerald-400 ${focusRing}`}><Mail className="h-4 w-4 text-emerald-400" aria-hidden="true" />{email}</a>
        </div>
      </section>
    </div>
  );
}

export function FaqSection() {
  return (
    <section aria-labelledby="faq-title" className="mt-14">
      <p className={eyebrow}>Help centre</p>
      <h2 id="faq-title" className="mt-2 font-display text-3xl font-semibold tracking-tight text-zinc-100">Frequently asked questions</h2>
      <div className="mt-6 max-w-3xl"><Accordion items={FAQS} idPrefix="faq" /></div>
    </section>
  );
}
