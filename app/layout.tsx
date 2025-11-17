import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from './_lib/i18n';
import { RtlController } from './_components/RtlController';

export const metadata: Metadata = {
  title: 'Espoo Business Advisor',
  description: 'Guided, multilingual business idea assistant for Espoo residents.',
  metadataBase: new URL('https://example.com'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className="h-full">
      <body className="min-h-screen bg-surface text-neutral-900 antialiased font-sans flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow"
        >
          Skip to content
        </a>
        <I18nProvider>
          <RtlController />
          <main id="main-content" role="main" className="app-shell">
            <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 space-y-8">
              {children}
            </div>
          </main>
        </I18nProvider>
      </body>
    </html>
  );
}


