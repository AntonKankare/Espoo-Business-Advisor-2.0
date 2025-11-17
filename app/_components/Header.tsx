'use client';

import { LanguageSwitcher } from './LanguageSwitcher';
import { useI18n } from '../_lib/i18n';

type HeaderProps = {
  hasStarted: boolean;
};

export function Header({ hasStarted }: HeaderProps) {
  const { t } = useI18n();
  return (
    <header role="banner" className="border-b border-neutral-100 bg-white/95 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">
          <a 
            href="/" 
            className="inline-flex items-center text-xl font-semibold tracking-tight text-neutral-900 hover:text-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg px-2 py-1 -ml-2"
            aria-label="Go to home page"
          >
            {t('appTitle')}
          </a>
          <div className="flex items-center">
            {!hasStarted && <LanguageSwitcher />}
          </div>
        </div>
      </div>
    </header>
  );
}


