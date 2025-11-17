 'use client';
 
 import { useState } from 'react';
 import { useI18n } from './_lib/i18n';
 import { Header } from './_components/Header';
 import { ChatExperience } from './_components/ChatExperience';
 
 export default function HomePage() {
   const { t } = useI18n();
   const [hasStarted, setHasStarted] = useState(false);
 
   return (
    <div className="min-h-screen flex flex-col">
       <Header hasStarted={hasStarted} />
      <main className="flex-1 flex flex-col">
          {hasStarted ? (
            <section aria-labelledby="chat-title" className="flex-1">
              <h1 id="chat-title" className="sr-only">{t('home.title')}</h1>
              <ChatExperience startNow />
            </section>
          ) : (
            <section aria-labelledby="home-title" className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
              {/* Subtle gradient backdrop */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-neutral-50 via-white to-white" />
              
              <div className="relative mx-auto w-full max-w-2xl">
                <div className="space-y-8 sm:space-y-10 text-center">
                  {/* Hero content */}
                  <div className="space-y-4 sm:space-y-6">
                    <h1 id="home-title" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-neutral-900 leading-tight px-2">
                      {t('home.title')}
                    </h1>
                    <p className="mx-auto max-w-xl text-base sm:text-lg md:text-xl text-neutral-600 leading-relaxed px-4">
                      {t('home.subtitle')}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="flex flex-col items-center gap-3 sm:gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setHasStarted(true)}
                      className="inline-flex items-center justify-center h-14 sm:h-[3.5rem] rounded-full bg-accent px-8 sm:px-10 text-base sm:text-lg font-medium text-white shadow-lg transition hover:shadow-xl hover:scale-105 active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 w-full max-w-xs sm:max-w-sm"
                    >
                      {t('home.startPreparing')}
                    </button>
                    <p className="text-sm sm:text-base text-neutral-500">{t('home.estimatedTime')}</p>
                  </div>
                </div>
              </div>
            </section>
          )}
       </main>
     </div>
  );
}

