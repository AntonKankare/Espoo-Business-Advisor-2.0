'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../_lib/i18n';
import { ProgressHeader } from './ProgressHeader';
import { PHASE_ORDER, PHASE_TO_I18N_KEY, PHASE_TO_STEP_INDEX, goToNextPhase, type ConversationPhase } from '@/lib/conversationPhases';

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type AdvisorSummary = {
  whatSell: string;
  toWhom: string;
  how: string;
  companyFormSuggestion: string;
  companyFormReasoning: string;
  keyQuestionsForAdvisor: string;
  specialTopics: string;
};

export function ChatExperience({ startNow }: { startNow?: boolean }) {
  const { t, lang, lockLanguage } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [allowDocumentUpload, setAllowDocumentUpload] = useState<boolean>(true);
  const [contactComplete, setContactComplete] = useState(false);
  const [phaseStepCount, setPhaseStepCount] = useState<number>(0);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<ConversationPhase>('BASICS');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [lastAction, setLastAction] = useState<'chat' | 'summary' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AdvisorSummary | null>(null);
  const [summaryDraft, setSummaryDraft] = useState<AdvisorSummary | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    municipality: '',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [hasAnnouncedReady, setHasAnnouncedReady] = useState(false);
  const [preChatActive, setPreChatActive] = useState(false);
  // If parent requests immediate start (coming from landing), enter pre-chat immediately
  useEffect(() => {
    if (startNow) {
      lockLanguage();
      setPreChatActive(true);
    }
  }, [startNow, lockLanguage]);
  const [visitedPhases, setVisitedPhases] = useState<Record<ConversationPhase, boolean>>({
    BASICS: true,
    IDEA: false,
    HOW: false,
    MONEY: false,
    SPECIAL: false,
    CONTACT: false,
  });

  const canSend = input.trim().length > 0 && !isLoading;

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading, summary]);

  const conversationVisible = useMemo(() => messages.length > 0 || sessionId !== null, [messages.length, sessionId]);

  // Language is locked when starting the preparation; no mid-conversation translation

  const currentStepIndex = useMemo<number>(() => (PHASE_TO_STEP_INDEX[phase] ?? 1) - 1, [phase]);

  const minutesLeftText = useMemo(() => {
    const total = PHASE_ORDER.length;
    const remainingSteps = Math.max(0, total - (currentStepIndex + 1));
    const min = Math.max(1, remainingSteps);
    const max = Math.max(min, remainingSteps + 2);
    const about = t('progress.about') || 'about';
    const minutes = t('progress.minutes') || 'minutes';
    const left = t('progress.left') || 'left';
    return `${about} ${min}–${max} ${minutes} ${left}`;
  }, [currentStepIndex, t]);

  const nextPhase = useCallback((p: ConversationPhase): ConversationPhase => goToNextPhase(p), []);

  // Number of assistant prompts to keep in each phase before advancing
  const PHASE_STEP_TARGET: Record<ConversationPhase, number> = {
    BASICS: 2, // Y-tunnus? + short idea
    IDEA: 1, // main customer group
    HOW: 3, // sell? deliver? company form?
    MONEY: 1, // pricing/costs
    SPECIAL: 1, // special topics
    CONTACT: Number.POSITIVE_INFINITY, // terminal
  };

  const lastAssistant = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return messages[i];
    }
    return null;
  }, [messages]);

  const suggestionOrder = useMemo(() => {
    const defaults = ['examples', 'simplify', 'askOne'] as const;
    if (!lastAssistant) return defaults;
    const text = lastAssistant.content || '';
    const isLong = text.length > 400 || text.split(/\n/).length > 6;
    const manyQuestions = (text.match(/\?/g) || []).length >= 3;
    if (manyQuestions) return ['askOne', 'simplify', 'examples'] as const;
    if (isLong) return ['simplify', 'examples', 'askOne'] as const;
    return defaults;
  }, [lastAssistant]);

  // Mark visited phases as the user progresses
  useEffect(() => {
    setVisitedPhases((prev) => (prev[phase] ? prev : { ...prev, [phase]: true }));
  }, [phase]);

  // Heuristic: compute isReadyForSummary from phases + content signals
  const isReadyForSummary = useMemo(() => {
    const allText = messages.map((m) => m.content.toLowerCase()).join(' ');
    const hasWhat = /\b(what|mitä|product|service|tuote|palvelu)\b/.test(allText);
    const hasToWhom = /\b(to whom|asiakas|customer|target|kohderyh|segment)\b/.test(allText);
    const hasHow = /\b(how|channel|myyn|kanava|verkkokauppa|store|delivery|toimitus|operations|toiminta)\b/.test(allText);
    const hasMoney = /\b(price|pricing|budget|cost|revenue|tulo|kustannus|rahoitus|funding|kassavirta)\b/.test(allText);
    const hasCompanyForm = /\b(company form|toiminimi|osakeyhti|oy|sole trader|osuuskunta|ky|ay)\b/.test(allText);
    const notSureCompanyForm = /\b(not sure|en tiedä|epävarma)\b/.test(allText);
    const phasesComplete =
      visitedPhases.BASICS &&
      visitedPhases.IDEA &&
      visitedPhases.HOW &&
      visitedPhases.MONEY &&
      (visitedPhases.SPECIAL || /\b(no special|ei erityistä|ei erityisiä)\b/.test(allText));
    return phasesComplete && hasWhat && hasToWhom && hasHow && hasMoney && (hasCompanyForm || notSureCompanyForm);
  }, [messages, visitedPhases]);

  // Announce once when ready and move to CONTACT phase; preload contact state
  useEffect(() => {
    if (isReadyForSummary && !hasAnnouncedReady) {
      setPhase('CONTACT');
      setPhaseStepCount(0);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t('chat.readyPrompt') || "You've now covered all the key topics. Next we can confirm your details and book a time with a business advisor." },
      ]);
      setHasAnnouncedReady(true);
      
      // Preload contact info
      if (sessionId) {
        (async () => {
          try {
            const res = await fetch(`/api/session/contact?sessionId=${encodeURIComponent(sessionId)}`);
            if (!res.ok) {
              setContactComplete(false);
              return;
            }
            const data = await res.json();
            if (data?.contact) {
              setContactForm({
                firstName: data.contact.firstName ?? '',
                lastName: data.contact.lastName ?? '',
                email: data.contact.email ?? '',
                phone: data.contact.phone ?? '',
                dateOfBirth: data.contact.dateOfBirth ? String(data.contact.dateOfBirth).slice(0, 10) : '',
                municipality: data.contact.municipality ?? '',
              });
            }
            setContactComplete(!!data?.complete);
          } catch {
            setContactComplete(false);
          }
        })();
      }
    }
  }, [isReadyForSummary, hasAnnouncedReady, t, sessionId]);

  async function sendMessage() {
    if (!canSend) return;
    setError(null);
    setLastAction('chat');
    const newUserMessage: ChatMessage = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          messages: [...messages, newUserMessage],
          uiLanguage: lang,
          userLanguage: lang,
          phase,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      const data = (await res.json()) as { sessionId: string; assistantMessage: ChatMessage };
      setSessionId(data.sessionId);
      setMessages((prev) => [...prev, data.assistantMessage]);
      // Count assistant prompts for current phase; advance when target reached
      setPhaseStepCount((count) => {
        const target = PHASE_STEP_TARGET[phase] ?? 1;
        const nextCount = count + 1;
        if (nextCount >= target) {
          setPhase((p) => (p === 'CONTACT' ? p : nextPhase(p)));
          return 0;
        }
        return nextCount;
      });
    } catch (e: any) {
      setError(t('errors.chatFailed'));
    } finally {
      setIsLoading(false);
    }
  }

  async function finalizeSummary() {
    if (!sessionId) return;
    setError(null);
    setIsLoading(true);
    setIsGeneratingSummary(true);
    setLastAction('summary');
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      const data = (await res.json()) as AdvisorSummary;
      setSummary(data);
      setSummaryDraft(data);
    } catch (e: any) {
      setError(t('errors.summaryFailed'));
    } finally {
      setIsLoading(false);
      setIsGeneratingSummary(false);
    }
  }

  async function checkContactAndMaybeOpen() {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/session/contact?sessionId=${encodeURIComponent(sessionId)}`);
      if (!res.ok) {
        // If the check fails, be conservative and ask for contact info
        setShowContactModal(true);
        return;
      }
      const data = await res.json();
      if (data?.contact) {
        setContactForm({
          firstName: data.contact.firstName ?? '',
          lastName: data.contact.lastName ?? '',
          email: data.contact.email ?? '',
          phone: data.contact.phone ?? '',
          dateOfBirth: data.contact.dateOfBirth ? String(data.contact.dateOfBirth).slice(0, 10) : '',
          municipality: data.contact.municipality ?? '',
        });
      }
      if (data?.complete) {
        await finalizeSummary();
      } else {
        setShowContactModal(true);
      }
    } catch {
      setShowContactModal(true);
    }
  }

  function validateContact(): string | null {
    const { firstName, lastName, email, phone, dateOfBirth, municipality } = contactForm;
    if (!firstName || !lastName || !email || !phone || !dateOfBirth || !municipality) {
      return t('contact.allFieldsRequired') || 'All fields are required.';
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return t('contact.invalidEmail') || 'Please enter a valid email address.';
    }
    return null;
  }

  async function saveContactAndContinue() {
    if (!sessionId) return;
    const validationError = validateContact();
    if (validationError) {
      setContactError(validationError);
      return;
    }
    setContactError(null);
    setContactLoading(true);
    try {
      const res = await fetch('/api/session/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, ...contactForm }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to save contact info');
      }
      setShowContactModal(false);
      setContactComplete(true);
      await finalizeSummary();
    } catch (e: any) {
      setContactError(e?.message || 'Failed to save contact info');
    } finally {
      setContactLoading(false);
    }
  }

  return (
    <div className="container mx-auto w-full max-w-4xl px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
      {!conversationVisible && (
        <div className="rounded-2xl sm:rounded-3xl border border-neutral-100 bg-white/80 backdrop-blur-xl p-4 sm:p-6 md:p-8 shadow-sm space-y-4 sm:space-y-6">
          {!preChatActive ? (
            <>
              <p className="text-neutral-700 text-sm sm:text-base leading-relaxed">{t('home.intro')}</p>
              <p className="text-xs sm:text-sm text-neutral-500">{t('home.estimatedTime')}</p>
              <div className="mt-3 sm:mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    lockLanguage();
                    setPreChatActive(true);
                  }}
                  className="inline-flex items-center justify-center h-12 sm:h-14 rounded-full bg-accent px-8 sm:px-10 text-sm sm:text-base font-medium text-white shadow-lg transition hover:shadow-xl hover:scale-105 active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 w-full sm:w-auto max-w-xs"
                >
                  {t('home.startPreparing')}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-neutral-900 text-base sm:text-lg font-medium text-center">{t('onboarding.documents.heading') || t('home.docsQuestion')}</p>
              <p className="text-xs sm:text-sm text-neutral-500 text-center">{t('onboarding.documents.acceptedTypes') || t('home.acceptedTypesNote')}</p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex flex-col gap-4 items-center"
              >
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint"
                  onChange={async (e) => {
                    setUploadError(null);
                    const inputEl = e.currentTarget as HTMLInputElement;
                    const files = inputEl.files;
                    if (!files || files.length === 0) return;
                    try {
                      lockLanguage();
                      // Ensure session exists
                      let sid = sessionId;
                      if (!sid) {
                        const r = await fetch('/api/session/start', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ uiLanguage: lang, userLanguage: lang }),
                        });
                        if (!r.ok) throw new Error('Session create failed');
                        const d = await r.json();
                        sid = d.sessionId;
                        setSessionId(sid);
                      }
                      if (!sid) return;
                      setUploading(true);
                      const fd = new FormData();
                      fd.append('sessionId', sid);
                      // Backward compatible: still append as "file" for single, but primarily as "files"
                      if (files.length === 1) {
                        fd.append('file', files[0]);
                      } else {
                        Array.from(files).forEach((f) => fd.append('files', f));
                      }
                      const up = await fetch('/api/upload-business-plan', { method: 'POST', body: fd });
                      if (!up.ok) {
                        const er = await up.json().catch(() => ({}));
                        throw new Error(er?.error || 'Upload failed');
                      }
                      const result = await up.json();
                      if (result?.assistantMessage) {
                        setMessages((prev) => [...prev, result.assistantMessage]);
                      }
                      // If docs already cover key info, jump near the end and allow booking
                      if (result?.hasEnoughInfo) {
                        setPhase('SPECIAL');
                        setHasAnnouncedReady(true);
                        setPhaseStepCount(0);
                      } else {
                        // Start normal flow by asking onboarding question
                        setMessages((prev) => [
                          ...prev,
                          { role: 'assistant', content: t('home.onboardingQuestion') },
                        ]);
                        setPhase('BASICS');
                        setPhaseStepCount(1);
                      }
                    } catch (err: any) {
                      setUploadError(t('upload.readError') || 'Could not read the files. Please try other files.');
                    } finally {
                      setUploading(false);
                      if (inputEl) inputEl.value = '';
                    }
                  }}
                  className="w-full max-w-md text-sm file:mr-4 file:rounded-full file:border-0 file:bg-accent/10 file:px-5 file:py-2.5 file:text-sm file:font-medium file:text-accent hover:file:bg-accent/20 file:cursor-pointer"
                />
                <button
                  type="button"
                  className="inline-flex items-center justify-center h-11 sm:h-12 rounded-full border border-neutral-200 bg-white px-5 sm:px-6 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 w-full sm:w-auto max-w-xs"
                  onClick={async () => {
                    // Skip to normal chat
                    try {
                      lockLanguage();
                      if (!sessionId) {
                        const r = await fetch('/api/session/start', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ uiLanguage: lang, userLanguage: lang }),
                        });
                        if (r.ok) {
                          const d = await r.json();
                          setSessionId(d.sessionId);
                        }
                      }
                    } catch {}
                    setAllowDocumentUpload(false);
                    setPhase('BASICS');
                    setPhaseStepCount(1);
                    setMessages([{ role: 'assistant', content: t('home.onboardingQuestion') }]);
                  }}
                >
                  {t('onboarding.documents.noDocumentsButton') || t('home.noDocsButton')}
                </button>
              </form>
              {uploadError && <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg text-center">{uploadError}</div>}
            </>
          )}
        </div>
      )}

      {conversationVisible && (
        <div className="space-y-4 sm:space-y-6">
          <ProgressHeader phase={phase} minutesLeftText={minutesLeftText} />
          <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 px-1">{t(PHASE_TO_I18N_KEY[phase])}</h2>
          {isReadyForSummary && (
            <div className="sticky top-[4.5rem] sm:top-20 z-10">
              <div className="rounded-xl sm:rounded-2xl border border-accent/20 bg-accent/5 backdrop-blur-xl px-4 py-3 sm:px-6 sm:py-4 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="text-xs sm:text-sm text-neutral-800 font-medium leading-relaxed">
                  {t('summary.readyNotice') ||
                    "You've covered the key topics. You can review your details and book a time when you're ready."}
                </div>
                <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3 flex-shrink-0">
                  {!contactComplete && (
                    <button
                      type="button"
                      onClick={() => setPhase('CONTACT')}
                      className="inline-flex items-center justify-center h-9 sm:h-10 rounded-full border border-neutral-200 bg-white px-4 sm:px-5 text-xs sm:text-sm font-medium text-neutral-800 shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                    >
                      {t('contact.title')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => (contactComplete ? void finalizeSummary() : setPhase('CONTACT'))}
                    className="inline-flex items-center justify-center h-9 sm:h-10 rounded-full bg-accent px-5 sm:px-6 text-xs sm:text-sm font-medium text-white shadow-lg transition hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    {contactComplete ? (t('chat.bookCta') || 'Confirm your details & book a time') : t('contact.saveAndContinue')}
                  </button>
                </div>
              </div>
            </div>
          )}
          {allowDocumentUpload && (
          <div className="rounded-2xl border border-neutral-100 bg-white/80 backdrop-blur-xl p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-medium text-neutral-900">{t('upload.title')}</div>
                <div className="text-xs text-neutral-500">{t('upload.note')}</div>
              </div>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex items-center gap-2"
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint"
                  onChange={async (e) => {
                    setUploadError(null);
                    const inputEl = e.currentTarget as HTMLInputElement;
                    const file = inputEl.files?.[0];
                    if (!file) return;
                    try {
                      // Ensure we have a session. If not, create one without adding synthetic chat messages.
                      let sid = sessionId;
                      if (!sid) {
                        const startRes = await fetch('/api/session/start', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ uiLanguage: lang, userLanguage: lang }),
                        });
                        if (!startRes.ok) {
                          setUploadError(t('upload.readError') || 'Could not read the PDF.');
                          return;
                        }
                        const startData = await startRes.json();
                        sid = startData.sessionId as string;
                        setSessionId(sid);
                      }
                      if (!sid) return;
                      setUploading(true);
                      const fd = new FormData();
                      fd.append('sessionId', sid);
                      fd.append('file', file);
                      const up = await fetch('/api/upload-business-plan', {
                        method: 'POST',
                        body: fd,
                      });
                      if (!up.ok) {
                        const er = await up.json().catch(() => ({}));
                        throw new Error(er?.error || 'Upload failed');
                      }
                      const result = await up.json();
                      if (result?.assistantMessage) {
                        setMessages((prev) => [...prev, result.assistantMessage]);
                      }
                    } catch (err: any) {
                      setUploadError(t('upload.readError') || 'Could not read the PDF. Please try another file.');
                    } finally {
                      setUploading(false);
                      if (inputEl) {
                        inputEl.value = '';
                      }
                    }
                  }}
                  className="text-sm file:mr-4 file:rounded-full file:border-0 file:bg-accent/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent hover:file:bg-accent/20 file:cursor-pointer"
                />
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm opacity-60"
                  title={t('upload.button')}
                >
                  {uploading ? t('chat.thinking') : t('upload.button')}
                </button>
              </form>
            </div>
            {uploadError && <div className="mt-3 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">{uploadError}</div>}
          </div>
          )}
          <div
            ref={scrollRef}
            className="max-h-[55vh] sm:max-h-[60vh] overflow-y-auto rounded-2xl sm:rounded-3xl border border-neutral-100 bg-gradient-to-b from-neutral-50/50 to-white p-4 sm:p-6"
            aria-live="polite"
          >
            <ul className="space-y-3 sm:space-y-4">
              {messages.map((m, idx) => (
                <li key={idx} className="flex">
                  {m.role === 'user' ? (
                    <div className="ml-auto max-w-[85%] sm:max-w-[80%] rounded-2xl sm:rounded-3xl bg-accent text-white px-4 py-2.5 sm:px-5 sm:py-3 shadow-md">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                    </div>
                  ) : (
                    <div className="mr-auto max-w-[90%] sm:max-w-[85%] rounded-2xl sm:rounded-3xl bg-white border border-neutral-100 text-neutral-900 px-4 py-2.5 sm:px-5 sm:py-3 shadow-sm">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                    </div>
                  )}
                </li>
              ))}
              {isLoading && (
                <li className="flex">
                  <div className="mr-auto max-w-[90%] sm:max-w-[85%] rounded-2xl sm:rounded-3xl bg-white border border-neutral-100 text-neutral-900 px-4 py-2.5 sm:px-5 sm:py-3 shadow-sm">
                    <p className="italic text-neutral-500 text-sm">{t('chat.thinking')}</p>
                  </div>
                </li>
              )}
            </ul>
          </div>

          {error && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-red-700 shadow-sm">
              <span className="leading-relaxed">{error}</span>
              <button
                type="button"
                onClick={() => (lastAction === 'summary' ? void finalizeSummary() : void sendMessage())}
                className="inline-flex items-center justify-center h-8 rounded-full border border-red-300 bg-white px-4 text-xs font-medium text-red-700 shadow-sm transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 self-end sm:self-auto"
              >
                {t('chat.retry')}
              </button>
            </div>
          )}

          <form
            className="flex items-center gap-2 sm:gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage();
            }}
          >
            <label htmlFor="chat-input" className="sr-only">
              {t('chat.inputPlaceholder')}
            </label>
            <textarea
              id="chat-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder={t('chat.inputPlaceholder')}
              rows={1}
              className="flex-1 resize-none rounded-xl sm:rounded-2xl border border-neutral-200 bg-white px-4 py-3 sm:px-5 sm:py-3.5 text-neutral-900 text-sm leading-tight shadow-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="flex-shrink-0 inline-flex items-center justify-center h-[46px] w-[46px] sm:w-auto sm:px-6 rounded-xl sm:rounded-2xl bg-accent text-sm font-medium text-white shadow-lg transition hover:shadow-xl hover:scale-105 active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg"
              aria-label={t('chat.send')}
            >
              <span className="hidden sm:inline">{t('chat.send')}</span>
              <svg className="sm:hidden h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>

          <div className="flex flex-wrap gap-2 sm:gap-2.5 justify-center">
            {phase === 'BASICS' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setInput(t('chat.suggestions.haveBusinessId') || '');
                    inputRef.current?.focus();
                  }}
                  className="inline-flex items-center rounded-full border border-neutral-200 bg-white/80 backdrop-blur px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-medium text-neutral-700 shadow-sm transition hover:bg-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  {t('chat.suggestions.haveBusinessId')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInput(t('chat.suggestions.startingCompany') || '');
                    inputRef.current?.focus();
                  }}
                  className="inline-flex items-center rounded-full border border-neutral-200 bg-white/80 backdrop-blur px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-medium text-neutral-700 shadow-sm transition hover:bg-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  {t('chat.suggestions.startingCompany')}
                </button>
              </>
            )}
            {suggestionOrder.map((k) => {
              const label =
                k === 'examples'
                  ? t('chat.suggestions.examples')
                  : k === 'simplify'
                  ? t('chat.suggestions.simplify')
                  : t('chat.suggestions.askOne');
              const textToInsert = label;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setInput(textToInsert);
                    inputRef.current?.focus();
                  }}
                  className="inline-flex items-center rounded-full border border-neutral-200 bg-white/80 backdrop-blur px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-medium text-neutral-700 shadow-sm transition hover:bg-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="pt-3 sm:pt-4">
            
            {isReadyForSummary && (
              <div className="mb-3 sm:mb-4 rounded-xl sm:rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3 sm:px-5 sm:py-3.5 text-xs sm:text-sm text-neutral-800 font-medium leading-relaxed text-center">
                {t('summary.readyNotice') ||
                  "You've covered the key topics. You can review your details and book a time when you're ready."}
              </div>
            )}
            <div className="flex items-center justify-center px-4">
              <button
                type="button"
                onClick={() => void checkContactAndMaybeOpen()}
                disabled={!sessionId || isLoading || (currentStepIndex < PHASE_ORDER.length - 1 && !isReadyForSummary)}
                title={
                  !sessionId || isLoading || (currentStepIndex < PHASE_ORDER.length - 1 && !isReadyForSummary)
                    ? t('summary.disabledHint')
                    : undefined
                }
                className="inline-flex items-center justify-center h-12 sm:h-14 rounded-full border border-neutral-200 bg-white px-6 sm:px-8 text-sm sm:text-base font-medium text-neutral-800 shadow-lg transition hover:shadow-xl hover:scale-105 active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg w-full sm:w-auto max-w-md"
              >
                {isReadyForSummary ? (t('chat.bookCta') || 'Confirm your details & book a time') : t('chat.finish')}
              </button>
            </div>
            {currentStepIndex < PHASE_ORDER.length - 1 && !isReadyForSummary && (
              <div className="mt-2 sm:mt-3 text-xs text-neutral-500 text-center px-4">
                {t('summary.createSummary')}
              </div>
            )}
          </div>

          {isGeneratingSummary && (
            <div className="text-xs sm:text-sm text-neutral-600 bg-neutral-50 px-4 py-3 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl text-center">{t('loading.generatingSummary')}</div>
          )}
          {phase === 'CONTACT' && !contactComplete && (
            <section aria-labelledby="contact-title" className="space-y-6">
              <h2 id="contact-title" className="text-2xl font-semibold text-neutral-900">
                {t('progress.steps.s6')}
              </h2>
              {contactError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                  {contactError}
                </div>
              )}
              <div className="rounded-3xl border border-neutral-100 bg-white/80 backdrop-blur-xl p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-neutral-900 mb-1.5">{t('contact.firstName')}</label>
                    <input id="firstName" type="text" value={contactForm.firstName} onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })} className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent" />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-neutral-900 mb-1.5">{t('contact.lastName')}</label>
                    <input id="lastName" type="text" value={contactForm.lastName} onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })} className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="email" className="block text-sm font-medium text-neutral-900 mb-1.5">{t('contact.email')}</label>
                    <input id="email" type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent" />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-neutral-900 mb-1.5">{t('contact.phone')}</label>
                    <input id="phone" type="tel" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent" />
                  </div>
                  <div>
                    <label htmlFor="dob" className="block text-sm font-medium text-neutral-900 mb-1.5">{t('contact.dateOfBirth')}</label>
                    <input id="dob" type="date" value={contactForm.dateOfBirth} onChange={(e) => setContactForm({ ...contactForm, dateOfBirth: e.target.value })} className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="municipality" className="block text-sm font-medium text-neutral-900 mb-1.5">{t('contact.municipality')}</label>
                    <input id="municipality" type="text" value={contactForm.municipality} onChange={(e) => setContactForm({ ...contactForm, municipality: e.target.value })} className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent" />
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => void saveContactAndContinue()}
                    disabled={contactLoading}
                    className="inline-flex items-center justify-center h-12 rounded-full bg-accent px-8 text-sm font-medium text-white shadow-lg transition hover:shadow-xl hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg"
                  >
                    {t('contact.saveAndContinue')}
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {summaryDraft && (
        <section aria-labelledby="summary-title" className="container mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <h2 id="summary-title" className="text-2xl font-semibold text-neutral-900">
            {t('summary.title')}
          </h2>
          <p className="text-sm text-neutral-600">{t('summary.editHelper')}</p>
          {confirmError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
              {confirmError}
            </div>
          )}
          <div className="rounded-3xl border border-neutral-100 bg-white/80 backdrop-blur-xl p-6 shadow-sm space-y-5">
            <SummaryEditRow
              label={t('summary.whatSell')}
              value={summaryDraft.whatSell}
              onChange={(v) => setSummaryDraft({ ...summaryDraft, whatSell: v })}
            />
            <SummaryEditRow
              label={t('summary.toWhom')}
              value={summaryDraft.toWhom}
              onChange={(v) => setSummaryDraft({ ...summaryDraft, toWhom: v })}
            />
            <SummaryEditRow
              label={t('summary.how')}
              value={summaryDraft.how}
              onChange={(v) => setSummaryDraft({ ...summaryDraft, how: v })}
            />
            <SummaryEditRow
              label={t('summary.companyFormSuggestion')}
              value={summaryDraft.companyFormSuggestion}
              onChange={(v) => setSummaryDraft({ ...summaryDraft, companyFormSuggestion: v })}
            />
            <SummaryEditRow
              label={t('summary.companyFormReasoning')}
              value={summaryDraft.companyFormReasoning}
              onChange={(v) => setSummaryDraft({ ...summaryDraft, companyFormReasoning: v })}
            />
            <SummaryEditRow
              label={t('summary.keyQuestionsForAdvisor')}
              value={summaryDraft.keyQuestionsForAdvisor}
              onChange={(v) => setSummaryDraft({ ...summaryDraft, keyQuestionsForAdvisor: v })}
            />
            <SummaryEditRow
              label={t('summary.specialTopics')}
              value={summaryDraft.specialTopics}
              onChange={(v) => setSummaryDraft({ ...summaryDraft, specialTopics: v })}
            />
          </div>
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={async () => {
                if (!sessionId || !summaryDraft) return;
                setIsConfirming(true);
                setConfirmError(null);
                try {
                  const res = await fetch('/api/summary/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId, ...summaryDraft }),
                  });
                  if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data?.error || 'Failed to confirm summary');
                  }
                  const updated = (await res.json()) as AdvisorSummary;
                  setSummary(updated);
                  setSummaryDraft(null);
                } catch (e: any) {
                  setConfirmError(e?.message || 'Failed to confirm summary');
                } finally {
                  setIsConfirming(false);
                }
              }}
              disabled={isConfirming}
              className="inline-flex items-center justify-center h-12 rounded-full bg-accent px-8 text-sm font-medium text-white shadow-lg transition hover:shadow-xl hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg"
            >
              {t('summary.confirmButton') || 'Confirm summary'}
            </button>
          </div>
        </section>
      )}

      {summary && !summaryDraft && (
        <section aria-labelledby="summary-title-final" className="container mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <h2 id="summary-title-final" className="text-2xl font-semibold text-neutral-900">
            {t('summary.title')}
          </h2>
          <div className="rounded-3xl border border-neutral-100 bg-white/80 backdrop-blur-xl p-6 shadow-sm space-y-5">
            <SummaryRow label={t('summary.whatSell')} value={summary.whatSell} />
            <SummaryRow label={t('summary.toWhom')} value={summary.toWhom} />
            <SummaryRow label={t('summary.how')} value={summary.how} />
            <SummaryRow label={t('summary.companyFormSuggestion')} value={summary.companyFormSuggestion} />
            <SummaryRow label={t('summary.companyFormReasoning')} value={summary.companyFormReasoning} />
            <SummaryRow label={t('summary.keyQuestionsForAdvisor')} value={summary.keyQuestionsForAdvisor} />
            <SummaryRow label={t('summary.specialTopics')} value={summary.specialTopics} />
          </div>
          {t('summary.finalCta') && (
            <div className="rounded-2xl border border-accent/20 bg-accent/5 px-6 py-4 text-sm text-neutral-800 font-medium text-center leading-relaxed">
              {t('summary.finalCta')}
            </div>
          )}
        </section>
      )}

      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" aria-hidden="true" onClick={() => !contactLoading && setShowContactModal(false)} />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-lg rounded-lg border border-neutral-200 bg-white p-5 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-neutral-900">{t('contact.title')}</h3>
            <p className="mt-1 text-sm text-neutral-700">{t('contact.description')}</p>
            {contactError && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {contactError}
              </div>
            )}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-neutral-800">{t('contact.firstName')}</label>
                <input id="firstName" type="text" value={contactForm.firstName} onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-neutral-800">{t('contact.lastName')}</label>
                <input id="lastName" type="text" value={contactForm.lastName} onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-neutral-800">{t('contact.email')}</label>
                <input id="email" type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-neutral-800">{t('contact.phone')}</label>
                <input id="phone" type="tel" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label htmlFor="dob" className="block text-sm font-medium text-neutral-800">{t('contact.dateOfBirth')}</label>
                <input id="dob" type="date" value={contactForm.dateOfBirth} onChange={(e) => setContactForm({ ...contactForm, dateOfBirth: e.target.value })} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="municipality" className="block text-sm font-medium text-neutral-800">{t('contact.municipality')}</label>
                <input id="municipality" type="text" value={contactForm.municipality} onChange={(e) => setContactForm({ ...contactForm, municipality: e.target.value })} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => !contactLoading && setShowContactModal(false)}
                className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50"
                disabled={contactLoading}
              >
                {t('contact.cancel')}
              </button>
              <button
                type="button"
                onClick={() => void saveContactAndContinue()}
                className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50"
                disabled={contactLoading}
              >
                {t('contact.saveAndContinue')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-neutral-600">{label}</div>
      <div className="text-neutral-900 leading-relaxed">{value || '—'}</div>
    </div>
  );
}

function SummaryEditRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-neutral-600">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 transition focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
      />
    </div>
  );
}


