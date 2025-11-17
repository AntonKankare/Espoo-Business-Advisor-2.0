'use client';

import { SUPPORTED_LANGUAGES, type UILanguage, useI18n } from '../_lib/i18n';
import { useEffect, useRef, useState } from 'react';

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!panelRef.current) return;
      if (panelRef.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', onClickOutside);
    }
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const label = lang.toUpperCase();

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-all hover:border-neutral-300 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <svg className="h-4 w-4 text-neutral-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          className="absolute right-0 z-50 mt-2 w-32 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl"
        >
          {SUPPORTED_LANGUAGES.map((code) => {
            const active = code === lang;
            return (
              <button
                key={code}
                role="option"
                aria-selected={active}
                className={`block w-full text-center px-4 py-2.5 text-sm font-medium transition-colors ${
                  active ? 'bg-accent text-white' : 'text-neutral-700 hover:bg-neutral-50'
                }`}
                onClick={() => {
                  setLang(code as UILanguage);
                  setOpen(false);
                }}
              >
                {code.toUpperCase()}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}


