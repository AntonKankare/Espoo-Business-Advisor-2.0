'use client';

import { useMemo, useState } from 'react';

export type AdvisorSessionItem = {
  id: string;
  createdAtISO: string;
  uiLanguage: string | null;
  userLanguage: string | null;
  stage: string | null;
  experienceLevel: string | null;
  whatSell: string | null;
  toWhom: string | null;
  how: string | null;
  companyFormSuggestion: string | null;
  companyFormReasoning: string | null;
  keyQuestionsForAdvisor: string | null;
  specialTopics: string | null;
};

export function AdvisorDashboard({ sessions }: { sessions: AdvisorSessionItem[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => sessions.find((s) => s.id === selectedId) ?? null,
    [selectedId, sessions]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold text-neutral-900">Advisor dashboard</h1>
        <p className="text-neutral-600 text-sm">Recent sessions</p>
      </div>

      <div className="space-y-3">
        {sessions.map((s) => (
          <div key={s.id} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-sm text-neutral-600">
                  {new Intl.DateTimeFormat(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(s.createdAtISO))}
                </div>
                <div className="text-neutral-900">
                  {(s.whatSell && s.whatSell.trim()) || 'Summary not generated yet'}
                </div>
                <div className="text-sm text-neutral-600">
                  {s.stage ? `Stage: ${s.stage}` : ''}
                  {s.stage && s.experienceLevel ? ' • ' : ''}
                  {s.experienceLevel ? `Experience: ${s.experienceLevel}` : ''}
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 shadow-sm hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  Open
                </button>
              </div>
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="text-sm text-neutral-600">No sessions yet.</div>
        )}
      </div>

      {selected && (
        <section aria-labelledby="detail-title" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="detail-title" className="text-lg font-semibold text-neutral-900">
              Session details
            </h2>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 shadow-sm hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Back to list
            </button>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm space-y-4">
            <MetaRow label="Created at" value={new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(selected.createdAtISO))} />
            <MetaRow label="UI language" value={selected.uiLanguage || '—'} />
            <MetaRow label="User language" value={selected.userLanguage || '—'} />
            <Divider />
            <SummaryRow label="What you sell" value={selected.whatSell} />
            <SummaryRow label="To whom" value={selected.toWhom} />
            <SummaryRow label="How" value={selected.how} />
            <SummaryRow label="Recommended company form" value={selected.companyFormSuggestion} />
            <SummaryRow label="Reasoning" value={selected.companyFormReasoning} />
            <SummaryRow label="Questions to ask the advisor" value={selected.keyQuestionsForAdvisor} />
            <SummaryRow label="Special topics" value={selected.specialTopics} />
          </div>
        </section>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium text-neutral-600">{label}</div>
      <div className="text-neutral-900">{(value && value.trim()) || '—'}</div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <div className="text-sm font-medium text-neutral-600">{label}:</div>
      <div className="text-neutral-900">{value}</div>
    </div>
  );
}

function Divider() {
  return <div className="h-px w-full bg-neutral-200" />;
}


