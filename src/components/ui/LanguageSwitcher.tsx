import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import type { Locale } from '../../i18n/translations';

// ─── Flag emoji per locale ────────────────────────────────────────────────────
const LOCALES: { value: Locale; flag: string; short: string }[] = [
  { value: 'en', flag: '🇬🇧', short: 'EN' },
  { value: 'si', flag: '🇱🇰', short: 'සි' },
  { value: 'ta', flag: '🇱🇰', short: 'த' },
];

// ─── Component ────────────────────────────────────────────────────────────────
const LanguageSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const active = LOCALES.find((l) => l.value === language) ?? LOCALES[0];

  return (
    <div ref={ref} className={`relative flex-shrink-0 ${className}`}>
      {/* Trigger button */}
      <button
        id="language-switcher-btn"
        aria-label={t('lang.label')}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-agri-border
          bg-white hover:bg-agri-bg hover:border-agri-primary/40
          text-xs font-semibold text-agri-text transition-all duration-200 select-none
          shadow-sm"
      >
        <span className="text-sm leading-none">{active.flag}</span>
        <span className="tracking-wide">{active.short}</span>
        <svg
          className={`h-3 w-3 text-agri-subtext transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-36 bg-white rounded-2xl border border-agri-border
            shadow-xl shadow-agri-text/10 overflow-hidden z-50 animate-fade-in-up"
        >
          <div className="px-3 pt-2.5 pb-1">
            <p className="text-[10px] font-bold text-agri-subtext uppercase tracking-widest">
              {t('lang.label')}
            </p>
          </div>
          <div className="p-1.5 space-y-0.5">
            {LOCALES.map((locale) => {
              const isActive = locale.value === language;
              return (
                <button
                  key={locale.value}
                  id={`lang-option-${locale.value}`}
                  onClick={() => { setLanguage(locale.value); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm
                    font-semibold transition-colors text-left ${
                    isActive
                      ? 'bg-agri-primary/10 text-agri-primary'
                      : 'text-agri-text hover:bg-agri-bg'
                  }`}
                >
                  <span className="text-base leading-none">{locale.flag}</span>
                  <span>{t(`lang.${locale.value}`)}</span>
                  {isActive && (
                    <svg
                      className="h-3.5 w-3.5 text-agri-primary ml-auto flex-shrink-0"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
