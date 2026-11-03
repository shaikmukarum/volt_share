import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { focusRing } from './tokens.js';

/* Accessible FAQ accordion: one item open at a time, smooth height animation */
export default function Accordion({ items, idPrefix = 'faq' }) {
  const [open, setOpen] = useState(0);
  return (
    <ul className="space-y-3">
      {items.map(([q, a], i) => {
        const isOpen = open === i;
        return (
          <li key={q} className="vs-card overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl">
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${idPrefix}-panel-${i}`}
                id={`${idPrefix}-btn-${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className={`flex min-h-[56px] w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-zinc-100 sm:px-6 ${focusRing} rounded-3xl`}
              >
                {q}
                <ChevronDown className={`h-5 w-5 shrink-0 text-emerald-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
            </h3>
            <div
              id={`${idPrefix}-panel-${i}`}
              role="region"
              aria-labelledby={`${idPrefix}-btn-${i}`}
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-400 sm:px-6">{a}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
