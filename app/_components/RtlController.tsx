'use client';

import { useEffect } from 'react';
import { useI18n } from '../_lib/i18n';

/**
 * Sets the document direction (ltr/rtl) based on the active UI language.
 * Ensures Arabic (ar) and Farsi (fa) render with proper RTL flow.
 */
export function RtlController() {
  const { lang } = useI18n();
  useEffect(() => {
    const isRtl = lang === 'ar' || lang === 'fa';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}


