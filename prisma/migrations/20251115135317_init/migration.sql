-- CreateTable
CREATE TABLE "BusinessIdeaSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "uiLanguage" TEXT NOT NULL,
    "userLanguage" TEXT,
    "userName" TEXT,
    "userEmail" TEXT,
    "experienceLevel" TEXT,
    "stage" TEXT,
    "whatSell" TEXT,
    "toWhom" TEXT,
    "how" TEXT,
    "companyFormSuggestion" TEXT,
    "companyFormReasoning" TEXT,
    "keyQuestionsForAdvisor" TEXT,
    "specialTopics" TEXT,
    "rawTranscript" TEXT
);
