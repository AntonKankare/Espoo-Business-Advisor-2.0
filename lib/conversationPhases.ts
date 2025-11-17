export type ConversationPhase =
  | 'BASICS'
  | 'IDEA'
  | 'HOW'
  | 'MONEY'
  | 'SPECIAL'
  | 'CONTACT';

export const PHASE_ORDER: ConversationPhase[] = [
  'BASICS',
  'IDEA',
  'HOW',
  'MONEY',
  'SPECIAL',
  'CONTACT',
];

export const PHASE_TO_I18N_KEY: Record<ConversationPhase, string> = {
  BASICS: 'chat.section.basics',
  IDEA: 'chat.section.idea',
  HOW: 'chat.section.how',
  MONEY: 'chat.section.money',
  SPECIAL: 'chat.section.special',
  CONTACT: 'chat.section.contact',
};

export const PHASE_TO_STEP_INDEX: Record<ConversationPhase, number> = {
  BASICS: 1,
  IDEA: 2,
  HOW: 3,
  MONEY: 4,
  SPECIAL: 5,
  CONTACT: 6,
};

export function goToNextPhase(current: ConversationPhase): ConversationPhase {
  const idx = PHASE_ORDER.indexOf(current);
  if (idx === -1 || idx === PHASE_ORDER.length - 1) return current;
  return PHASE_ORDER[idx + 1];
}


