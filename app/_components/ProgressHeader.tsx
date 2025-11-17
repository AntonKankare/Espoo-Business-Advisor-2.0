'use client';

import { useI18n } from '../_lib/i18n';
import { PHASE_ORDER, PHASE_TO_STEP_INDEX, type ConversationPhase } from '@/lib/conversationPhases';

type ProgressHeaderProps = {
  phase: ConversationPhase;
  minutesLeftText?: string;
};

export function ProgressHeader({ phase, minutesLeftText }: ProgressHeaderProps) {
  const { t } = useI18n();
  const total = PHASE_ORDER.length;
  const currentHuman = PHASE_TO_STEP_INDEX[phase] ?? 1;
  const template = t('progress.stepLabel') || 'Step {{current}} of {{total}}';
  const stepLabel = template.replace('{{current}}', String(currentHuman)).replace('{{total}}', String(total));

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white/90 backdrop-blur-xl p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative h-1.5 w-full rounded-full bg-neutral-100">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent to-accent/80 transition-all duration-500 ease-out"
              style={{ width: `${(currentHuman / total) * 100}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between text-sm">
            <div className="font-medium text-neutral-900">{stepLabel}</div>
            {minutesLeftText ? <div className="whitespace-nowrap text-xs text-neutral-500">{minutesLeftText}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}


