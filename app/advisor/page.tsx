import prisma from '@/lib/prisma';
import { AdvisorGate } from '../_components/AdvisorGate';
import { AdvisorDashboard, type AdvisorSessionItem } from '../_components/AdvisorDashboard';

export const dynamic = 'force-dynamic';

export default async function AdvisorPage() {
  const sessions = await prisma.businessIdeaSession.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      uiLanguage: true,
      userLanguage: true,
      stage: true,
      experienceLevel: true,
      whatSell: true,
      toWhom: true,
      how: true,
      companyFormSuggestion: true,
      companyFormReasoning: true,
      keyQuestionsForAdvisor: true,
      specialTopics: true,
    },
  });

  const data: AdvisorSessionItem[] = sessions.map((s) => ({
    id: s.id,
    createdAtISO: s.createdAt.toISOString(),
    uiLanguage: (s.uiLanguage as unknown as string) ?? null,
    userLanguage: s.userLanguage ?? null,
    stage: (s.stage as unknown as string) ?? null,
    experienceLevel: (s.experienceLevel as unknown as string) ?? null,
    whatSell: s.whatSell ?? null,
    toWhom: s.toWhom ?? null,
    how: s.how ?? null,
    companyFormSuggestion: s.companyFormSuggestion ?? null,
    companyFormReasoning: s.companyFormReasoning ?? null,
    keyQuestionsForAdvisor: s.keyQuestionsForAdvisor ?? null,
    specialTopics: s.specialTopics ?? null,
  }));

  return (
    <section className="space-y-6">
      <AdvisorGate>
        <AdvisorDashboard sessions={data} />
      </AdvisorGate>
    </section>
  );
}


