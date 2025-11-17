'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const SUPPORTED_LANGUAGES = ['fi', 'en', 'sv', 'ar', 'ru', 'fa'] as const;
export type UILanguage = typeof SUPPORTED_LANGUAGES[number];

type TranslationDict = {
  appTitle: string;
  home: {
    title: string;
    subtitle: string;
    getStartedButton: string;
    startPreparing: string;
    intro: string;
    estimatedTime: string;
    onboardingQuestion: string;
    onboardingYesId?: string;
    onboardingStarting?: string;
    docsQuestion?: string;
    uploadDocsButton?: string;
    noDocsButton?: string;
    acceptedTypesNote?: string;
  };
  chat: {
    inputPlaceholder: string;
    send: string;
    finish: string;
    thinking: string;
    retry: string;
    suggestions: {
      examples: string;
      simplify: string;
      askOne: string;
      haveBusinessId?: string;
      startingCompany?: string;
    };
    readyPrompt?: string;
    bookCta?: string;
    section?: {
      basics: string;
      idea: string;
      how: string;
      money: string;
      special: string;
      contact: string;
    };
  };
  summary: {
    title: string;
    createSummary: string;
    whatSell: string;
    toWhom: string;
    how: string;
    companyFormSuggestion: string;
    companyFormReasoning: string;
    keyQuestionsForAdvisor: string;
    specialTopics: string;
    editHelper?: string;
    confirmButton?: string;
    disabledHint?: string;
    finalCta?: string;
    readyNotice?: string;
  };
  errors: {
    chatFailed: string;
    summaryFailed: string;
    translateFailed?: string;
  };
  loading: {
    generatingSummary: string;
  };
  progress?: {
    steps: {
      s1: string;
      s2: string;
      s3: string;
      s4: string;
      s5: string;
      s6: string;
    };
    stepLabel?: string;
    about: string;   // about/approx
    minutes: string; // minutes
    left: string;    // left/remaining
  };
  contact?: {
    title: string;
    description: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    municipality: string;
    cancel: string;
    saveAndContinue: string;
    invalidEmail: string;
    allFieldsRequired: string;
  };
  upload?: {
    title: string;
    note: string;
    button: string;
    onlyPdf: string;
    readError: string;
    successIntro: string;
  };
  onboarding?: {
    documents: {
      heading: string;
      acceptedTypes: string;
      noDocumentsButton: string;
      noFileSelected?: string;
    };
  };
};

const TRANSLATIONS: Record<UILanguage, TranslationDict> = {
  en: {
    appTitle: 'Espoo Business Advisor',
    home: {
      title: 'Start your business in Espoo with guidance',
      subtitle:
        'A simple, multilingual assistant that helps you shape your business idea, step by step — and prepares a clear summary for your advisor.',
      getStartedButton: 'Get started',
      startPreparing: 'Start preparing',
      intro: 'Answer a few questions with the help of AI. When you are ready, enter your details and book an appointment.',
      estimatedTime: 'Estimated time: 5–10 minutes',
      onboardingQuestion: 'Do you already have a registered company or business ID (Y‑tunnus)? Or are you just starting a new business?',
      onboardingYesId: 'I already have a Business ID (Y‑tunnus)',
      onboardingStarting: 'I am starting a new company',
      docsQuestion: 'Do you already have documents that describe your current or planned company (e.g. business plan, pitch deck, financial excel)?',
      uploadDocsButton: 'Upload documents',
      noDocsButton: "I don't have documents",
      acceptedTypesNote: 'Accepted: PDF, Word (.docx), Excel (.xlsx/.xls), PowerPoint (.pptx)',
    },
    chat: {
      inputPlaceholder: 'Type your message…',
      send: 'Send',
      finish: 'Finish → See my summary',
      thinking: 'Thinking…',
      retry: 'Retry',
      suggestions: {
        examples: 'Give examples',
        simplify: 'Explain more simply',
        askOne: 'Can you ask me one question at a time?',
        haveBusinessId: 'I already have a Business ID (Y‑tunnus)',
        startingCompany: 'I am starting a new company',
      },
      readyPrompt: "You’ve now covered all the key topics. Next we can confirm your details and book a time with a business advisor.",
      bookCta: 'Confirm your details & book a time',
      section: {
        basics: 'Basic info & company status',
        idea: 'What & for whom',
        how: 'How it works',
        money: 'Money & funding',
        special: 'Special topics',
        contact: 'Contact & summary',
      },
    },
    summary: {
      title: 'Your advisor summary',
      createSummary: 'Book an advisor meeting',
      whatSell: 'What you sell',
      toWhom: 'To whom',
      how: 'How',
      companyFormSuggestion: 'Recommended company form',
      companyFormReasoning: 'Reasoning',
      keyQuestionsForAdvisor: 'Questions to ask the advisor',
      specialTopics: 'Special topics',
      editHelper: 'You can still adjust this before we send it to your advisor.',
      confirmButton: 'Confirm summary',
      disabledHint: 'Please complete the steps above before creating your summary.',
      finalCta: 'Your preparation summary is ready. You can now book a time with a Business Espoo advisor.',
      readyNotice: 'You’ve covered the key topics. You can review your details and book a time when you’re ready.',
    },
    errors: {
      chatFailed: 'Message failed to send. Please try again.',
      summaryFailed: 'Could not generate the summary. Please try again or take the transcript to your advisor.',
      translateFailed: 'Could not translate previous messages. New messages will use the selected language.',
    },
    loading: {
      generatingSummary: 'Generating your summary…',
    },
    progress: {
      steps: {
        s1: 'Basic info & company status',
        s2: 'What & for whom',
        s3: 'How it works',
        s4: 'Money & funding',
        s5: 'Special topics',
        s6: 'Contact & summary',
      },
      stepLabel: 'Step {{current}} of {{total}}',
      about: 'about',
      minutes: 'minutes',
      left: 'left',
    },
    contact: {
      title: 'Contact details',
      description: 'Before we generate your summary, we need your contact details.',
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      phone: 'Phone number',
      dateOfBirth: 'Date of birth',
      municipality: 'Municipality',
      cancel: 'Cancel',
      saveAndContinue: 'Save & continue',
      invalidEmail: 'Please enter a valid email address.',
      allFieldsRequired: 'All fields are required.',
    },
    upload: {
      title: 'Already have a business plan? Upload a PDF and I’ll read it.',
      note: 'Optional – you can continue without uploading anything.',
      button: 'Upload PDF',
      onlyPdf: 'Please upload a PDF file.',
      readError: 'Could not read the PDF. Please try another file.',
      successIntro: 'I read your business plan. Here’s a quick summary and what might still be missing:',
    },
    onboarding: {
      documents: {
        heading: 'Do you already have documents that describe your current or planned company (e.g. business plan, pitch deck, financial excel)?',
        acceptedTypes: 'Accepted: PDF, Word (.docx), Excel (.xlsx/.xls), PowerPoint (.pptx)',
        noDocumentsButton: "I don't have documents",
        noFileSelected: 'No file chosen',
      },
    },
  },
  fi: {
    appTitle: 'Espoon Yritysneuvoja',
    home: {
      title: 'Aloita yritystoiminta Espoossa tuetusti',
      subtitle:
        'Yksinkertainen, monikielinen avustaja, joka auttaa jäsentämään liikeideasi vaihe vaiheelta — ja tuottaa selkeän yhteenvedon neuvojalle.',
      getStartedButton: 'Aloita',
      startPreparing: 'Aloita valmistelut',
      intro: 'Vastaa muutamaan kysymykseen tekoälyn avulla. Kun olet valmis, syötä tietosi ja varaa aika.',
      estimatedTime: 'Arvioitu aika: 5–10 minuuttia',
      onboardingQuestion: 'Onko sinulla jo rekisteröity yritys tai Y‑tunnus? Vai oletko aloittamassa uutta yritystä?',
      onboardingYesId: 'Minulla on jo Y‑tunnus',
      onboardingStarting: 'Olen aloittamassa uutta yritystä',
      docsQuestion: 'Onko sinulla jo dokumentteja, jotka kuvaavat nykyistä tai suunniteltua yritystäsi (esim. liiketoimintasuunnitelma, pitch deck, talous‑Excel)?',
      uploadDocsButton: 'Lataa dokumentit',
      noDocsButton: 'Minulla ei ole dokumentteja',
      acceptedTypesNote: 'Tuetut: PDF, Word (.docx), Excel (.xlsx/.xls), PowerPoint (.pptx)',
    },
    chat: {
      inputPlaceholder: 'Kirjoita viesti…',
      send: 'Lähetä',
      finish: 'Valmis → Näytä yhteenveto',
      thinking: 'Hetkinen…',
      retry: 'Yritä uudelleen',
      suggestions: {
        examples: 'Anna esimerkkejä',
        simplify: 'Selitä yksinkertaisemmin',
        askOne: 'Voitko kysyä yhden kysymyksen kerrallaan?',
        haveBusinessId: 'Minulla on jo Y‑tunnus',
        startingCompany: 'Olen aloittamassa uutta yritystä',
      },
      readyPrompt: 'Olet nyt käynyt läpi keskeiset aiheet. Seuraavaksi varmistetaan tietosi ja varataan aika yritysneuvojalle.',
      bookCta: 'Vahvista tietosi ja varaa aika',
      section: {
        basics: 'Perustiedot ja yrityksen tila',
        idea: 'Mitä ja kenelle',
        how: 'Miten se toimii',
        money: 'Raha ja rahoitus',
        special: 'Erityisaiheet',
        contact: 'Yhteystiedot ja yhteenveto',
      },
    },
    summary: {
      title: 'Yhteenveto neuvojalle',
      createSummary: 'Varaa aika neuvojalle',
      whatSell: 'Mitä myyt',
      toWhom: 'Kenelle',
      how: 'Miten',
      companyFormSuggestion: 'Suositeltu yritysmuoto',
      companyFormReasoning: 'Perustelut',
      keyQuestionsForAdvisor: 'Kysymykset neuvojalle',
      specialTopics: 'Erityisaiheet',
      editHelper: 'Voit vielä muokata tätä ennen kuin lähetämme yhteenvedon neuvojalle.',
      confirmButton: 'Vahvista yhteenveto',
      disabledHint: 'Täytä vaiheet yllä ennen yhteenvedon luontia.',
      finalCta: 'Yhteenvetosi on valmis. Voit nyt varata ajan Business Espoo -yritysneuvojalle.',
      readyNotice: 'Olet käynyt läpi tärkeimmät asiat. Voit tarkistaa tietosi ja varata ajan, kun olet valmis.',
    },
    errors: {
      chatFailed: 'Viestin lähetys epäonnistui. Yritä uudelleen.',
      summaryFailed: 'Yhteenvedon luonti epäonnistui. Yritä uudelleen tai vie keskustelu neuvojalle.',
      translateFailed: 'Aiemmien viestien kääntäminen epäonnistui. Uudet viestit ovat valitulla kielellä.',
    },
    loading: {
      generatingSummary: 'Luodaan yhteenvetoa…',
    },
    progress: {
      steps: {
        s1: 'Perustiedot ja yrityksen tila',
        s2: 'Mitä ja kenelle',
        s3: 'Miten se toimii',
        s4: 'Raha ja rahoitus',
        s5: 'Erityisaiheet',
        s6: 'Yhteystiedot ja yhteenveto',
      },
      stepLabel: 'Vaihe {{current}} / {{total}}',
      about: 'noin',
      minutes: 'minuuttia',
      left: 'jäljellä',
    },
    contact: {
      title: 'Yhteystiedot',
      description: 'Ennen yhteenvedon luontia tarvitsemme yhteystietosi.',
      firstName: 'Etunimi',
      lastName: 'Sukunimi',
      email: 'Sähköposti',
      phone: 'Puhelinnumero',
      dateOfBirth: 'Syntymäaika',
      municipality: 'Kotikunta',
      cancel: 'Peruuta',
      saveAndContinue: 'Tallenna ja jatka',
      invalidEmail: 'Anna kelvollinen sähköpostiosoite.',
      allFieldsRequired: 'Kaikki kentät ovat pakollisia.',
    },
    upload: {
      title: 'Onko sinulla jo liiketoimintasuunnitelma? Lataa PDF, niin luen sen.',
      note: 'Vapaaehtoinen – voit myös jatkaa lataamatta mitään.',
      button: 'Lataa PDF',
      onlyPdf: 'Lataa PDF-tiedosto.',
      readError: 'PDF-tiedoston lukeminen epäonnistui. Yritä toista tiedostoa.',
      successIntro: 'Luimme liiketoimintasuunnitelmasi. Tässä lyhyt yhteenveto ja mitä voi vielä puuttua:',
    },
    onboarding: {
      documents: {
        heading: 'Onko sinulla jo dokumentteja, jotka kuvaavat nykyistä tai suunniteltua yritystäsi (esim. liiketoimintasuunnitelma, pitch deck, talous‑Excel)?',
        acceptedTypes: 'Hyväksytyt: PDF, Word (.docx), Excel (.xlsx/.xls), PowerPoint (.pptx)',
        noDocumentsButton: 'Minulla ei ole dokumentteja',
        noFileSelected: 'Ei valittua tiedostoa',
      },
    },
    
  },
  sv: {
    appTitle: 'Esbo företagsrådgivare',
    home: {
      title: 'Starta ditt företag i Esbo med handledning',
      subtitle:
        'En enkel, flerspråkig assistent som hjälper dig att forma din affärsidé steg för steg — och tar fram en tydlig sammanfattning till din rådgivare.',
      getStartedButton: 'Kom igång',
      startPreparing: 'Börja förberedelserna',
      intro: 'Svara på några frågor med hjälp av AI. När du är klar, fyll i dina uppgifter och boka tid.',
      estimatedTime: 'Uppskattad tid: 5–10 minuter',
      onboardingQuestion: 'Har du redan ett registrerat företag eller FO-nummer (Y‑tunnus), eller är du på väg att starta nytt?',
    },
    chat: {
      inputPlaceholder: 'Skriv ditt meddelande…',
      send: 'Skicka',
      finish: 'Klar → Visa sammanfattning',
      thinking: 'Tänker…',
      retry: 'Försök igen',
      suggestions: {
        examples: 'Ge exempel',
        simplify: 'Förklara enklare',
        askOne: 'Kan du ställa en fråga i taget?',
        haveBusinessId: 'Jag har redan FO-nummer',
        startingCompany: 'Jag startar ett nytt företag',
      },
      readyPrompt: 'Du har nu gått igenom de viktigaste delarna. Låt oss bekräfta dina uppgifter och boka tid hos en rådgivare.',
      bookCta: 'Bekräfta uppgifter och boka tid',
      section: {
        basics: 'Grundinfo & företagsstatus',
        idea: 'Vad & för vem',
        how: 'Hur det fungerar',
        money: 'Pengar & finansiering',
        special: 'Särskilda ämnen',
        contact: 'Kontakt & sammanfattning',
      },
    },
    summary: {
      title: 'Din sammanfattning för rådgivaren',
      createSummary: 'Boka tid hos rådgivaren',
      whatSell: 'Vad du säljer',
      toWhom: 'Till vem',
      how: 'Hur',
      companyFormSuggestion: 'Rekommenderad företagsform',
      companyFormReasoning: 'Motivering',
      keyQuestionsForAdvisor: 'Frågor till rådgivaren',
      specialTopics: 'Särskilda ämnen',
      editHelper: 'Du kan fortfarande justera detta innan vi skickar det till rådgivaren.',
      confirmButton: 'Bekräfta sammanfattning',
    },
    errors: {
      chatFailed: 'Meddelandet kunde inte skickas. Försök igen.',
      summaryFailed: 'Kunde inte skapa sammanfattningen. Försök igen eller ta med dialogen till rådgivaren.',
    },
    loading: {
      generatingSummary: 'Skapar din sammanfattning…',
    },
    progress: {
      steps: {
        s1: 'Grundinfo & företagsstatus',
        s2: 'Vad & för vem',
        s3: 'Hur det fungerar',
        s4: 'Pengar & finansiering',
        s5: 'Särskilda ämnen',
        s6: 'Kontakt & sammanfattning',
      },
      stepLabel: 'Steg {{current}} av {{total}}',
      about: 'cirka',
      minutes: 'minuter',
      left: 'kvar',
    },
    onboarding: {
      documents: {
        heading: 'Har du redan dokument som beskriver ditt nuvarande eller planerade företag (t.ex. affärsplan, pitch deck, finansiell excel)?',
        acceptedTypes: 'Godkända: PDF, Word (.docx), Excel (.xlsx/.xls), PowerPoint (.pptx)',
        noDocumentsButton: 'Jag har inga dokument',
        noFileSelected: 'Ingen fil vald',
      },
    },
    
  },
  ar: {
    appTitle: 'مستشار الأعمال في إسبو',
    home: {
      title: 'ابدأ عملك في إسبو مع إرشاد خطوة بخطوة',
      subtitle:
        'مساعد بسيط ومتعدّد اللغات يساعدك على توضيح فكرتك التجارية خطوة بخطوة — ويُعد ملخصًا واضحًا لمستشارك.',
      getStartedButton: 'ابدأ الآن',
      startPreparing: 'ابدأ التحضير',
      intro: 'أجب عن بعض الأسئلة بمساعدة الذكاء الاصطناعي. عندما تكون جاهزًا، أدخل بياناتك واحجز موعدًا.',
      estimatedTime: 'الوقت المُقدّر: ٥–١٠ دقائق',
      onboardingQuestion: 'هل لديك شركة مسجلة أو رقم عمل (Y‑tunnus)؟ أم أنك تبدأ نشاطًا تجاريًا جديدًا؟',
    },
    chat: {
      inputPlaceholder: 'اكتب رسالتك…',
      send: 'إرسال',
      finish: 'انتهيت → عرض الملخص',
      thinking: 'جارٍ التفكير…',
      retry: 'إعادة المحاولة',
      suggestions: {
        examples: 'أعطِ أمثلة',
        simplify: 'اشرح بشكل أبسط',
        askOne: 'هل يمكنك طرح سؤالًا واحدًا في كل مرة؟',
        haveBusinessId: 'I already have a Business ID (Y‑tunnus)',
        startingCompany: 'I am starting a new company',
      },
      readyPrompt: 'لقد غطّيت الآن المواضيع الأساسية. لنؤكد بياناتك ونحجز موعدًا مع مستشار الأعمال.',
      bookCta: 'تأكيد البيانات وحجز موعد',
      section: {
        basics: 'المعلومات الأساسية وحالة الشركة',
        idea: 'ماذا ولمن',
        how: 'كيف يعمل',
        money: 'المال والتمويل',
        special: 'مواضيع خاصة',
        contact: 'التواصل والملخص',
      },
    },
    summary: {
      title: 'ملخصك للمستشار',
      createSummary: 'احجز موعدًا مع المستشار',
      whatSell: 'ماذا تبيع',
      toWhom: 'لمن',
      how: 'كيف',
      companyFormSuggestion: 'الشكل القانوني المُوصى به',
      companyFormReasoning: 'التبرير',
      keyQuestionsForAdvisor: 'أسئلة للمستشار',
      specialTopics: 'مواضيع خاصة',
      editHelper: 'لا يزال بإمكانك تعديل هذا قبل إرساله إلى المستشار.',
      confirmButton: 'تأكيد الملخص',
    },
    errors: {
      chatFailed: 'تعذّر إرسال الرسالة. يُرجى المحاولة مرة أخرى.',
      summaryFailed: 'تعذّر إنشاء الملخص. حاول مجددًا أو خذ نص المحادثة إلى المستشار.',
    },
    loading: {
      generatingSummary: 'جارٍ إنشاء الملخص…',
    },
    progress: {
      steps: {
        s1: 'معلومات أساسية وحالة الشركة',
        s2: 'ماذا ولمن',
        s3: 'كيف يعمل',
        s4: 'المال والتمويل',
        s5: 'مواضيع خاصة',
        s6: 'التواصل والملخص',
      },
      stepLabel: 'الخطوة {{current}} من {{total}}',
      about: 'حوالي',
      minutes: 'دقيقة',
      left: 'متبقية',
    },
    onboarding: {
      documents: {
        heading: 'هل لديك بالفعل مستندات تصف شركتك الحالية أو المخطط لها (مثل خطة العمل، العرض التقديمي، ملف مالي)؟',
        acceptedTypes: 'التنسيقات المقبولة: PDF، Word (.docx)، Excel (.xlsx/.xls)، PowerPoint (.pptx)',
        noDocumentsButton: 'ليس لدي مستندات',
        noFileSelected: 'لم يتم اختيار ملف',
      },
    },
    
  },
  ru: {
    appTitle: 'Бизнес‑консультант Эспоо',
    home: {
      title: 'Начните свой бизнес в Эспоо с поддержкой',
      subtitle:
        'Простой многоязычный помощник, который помогает сформулировать вашу бизнес‑идею шаг за шагом и подготовит краткое резюме для консультанта.',
      getStartedButton: 'Начать',
      startPreparing: 'Начать подготовку',
      intro: 'Ответьте на несколько вопросов с помощью ИИ. Когда будете готовы, введите свои данные и запишитесь на встречу.',
      estimatedTime: 'Оценочное время: 5–10 минут',
      onboardingQuestion: 'У вас уже есть зарегистрированная компания или бизнес‑ID (Y‑tunnus)? Или вы только начинаете новый бизнес?',
    },
    chat: {
      inputPlaceholder: 'Введите сообщение…',
      send: 'Отправить',
      finish: 'Готово → Показать резюме',
      thinking: 'Думаю…',
      retry: 'Повторить',
      suggestions: {
        examples: 'Приведи примеры',
        simplify: 'Объясни проще',
        askOne: 'Можешь задавать по одному вопросу?',
        haveBusinessId: 'I already have a Business ID (Y‑tunnus)',
        startingCompany: 'I am starting a new company',
      },
      readyPrompt: 'Вы прошли основные темы. Давайте подтвердим ваши данные и запишемся на встречу с консультантом.',
      bookCta: 'Подтвердить данные и записаться',
      section: {
        basics: 'Основная информация и статус компании',
        idea: 'Что и для кого',
        how: 'Как это работает',
        money: 'Деньги и финансирование',
        special: 'Особые темы',
        contact: 'Контакты и резюме',
      },
    },
    summary: {
      title: 'Ваше резюме для консультанта',
      createSummary: 'Записаться на встречу с консультантом',
      whatSell: 'Что вы продаёте',
      toWhom: 'Кому',
      how: 'Как',
      companyFormSuggestion: 'Рекомендуемая форма компании',
      companyFormReasoning: 'Обоснование',
      keyQuestionsForAdvisor: 'Вопросы для консультанта',
      specialTopics: 'Особые темы',
      editHelper: 'Вы можете отредактировать это перед отправкой консультанту.',
      confirmButton: 'Подтвердить резюме',
    },
    errors: {
      chatFailed: 'Не удалось отправить сообщение. Повторите попытку.',
      summaryFailed: 'Не удалось создать резюме. Попробуйте снова или возьмите переписку к консультанту.',
    },
    loading: {
      generatingSummary: 'Создаём ваше резюме…',
    },
    progress: {
      steps: {
        s1: 'Основное & статус компании',
        s2: 'Что и для кого',
        s3: 'Как это работает',
        s4: 'Деньги и финансирование',
        s5: 'Особые темы',
        s6: 'Контакты и резюме',
      },
      stepLabel: 'Шаг {{current}} из {{total}}',
      about: 'примерно',
      minutes: 'минут',
      left: 'осталось',
    },
    onboarding: {
      documents: {
        heading: 'Есть ли у вас документы, которые описывают вашу текущую или планируемую компанию (например, бизнес‑план, презентация, финансовая таблица)?',
        acceptedTypes: 'Поддерживаемые форматы: PDF, Word (.docx), Excel (.xlsx/.xls), PowerPoint (.pptx)',
        noDocumentsButton: 'У меня нет документов',
        noFileSelected: 'Файл не выбран',
      },
    },
    
  },
  fa: {
    appTitle: 'مشاور کسب‌وکار اسپو',
    home: {
      title: 'کسب‌وکارتان را در اسپو با راهنمایی آغاز کنید',
      subtitle:
        'یک دستیار ساده و چندزبانه که به شما کمک می‌کند ایدهٔ کسب‌وکار خود را گام‌به‌گام شفاف کنید — و خلاصه‌ای روشن برای مشاور آماده می‌کند.',
      getStartedButton: 'شروع',
      startPreparing: 'شروع آماده‌سازی',
      intro: 'به چند سؤال با کمک هوش مصنوعی پاسخ دهید. وقتی آماده بودید، اطلاعات خود را وارد کرده و وقت بگیرید.',
      estimatedTime: 'زمان تقریبی: ۵–۱۰ دقیقه',
      onboardingQuestion: 'آیا از قبل شرکت ثبت‌شده یا شناسهٔ تجاری (Y‑tunnus) دارید؟ یا تازه می‌خواهید کسب‌وکار جدیدی شروع کنید؟',
    },
    chat: {
      inputPlaceholder: 'پیام خود را بنویسید…',
      send: 'ارسال',
      finish: 'تمام شد → نمایش خلاصه',
      thinking: 'در حال فکر کردن…',
      retry: 'تلاش دوباره',
      suggestions: {
        examples: 'مثال بزن',
        simplify: 'ساده‌تر توضیح بده',
        askOne: 'می‌توانی یک سؤال یک‌به‌یک بپرسی؟',
        haveBusinessId: 'I already have a Business ID (Y‑tunnus)',
        startingCompany: 'I am starting a new company',
      },
      readyPrompt: 'اکنون موضوعات اصلی را پوشش داده‌ایم. بیایید اطلاعاتت را تأیید کنیم و وقت ملاقات رزرو کنیم.',
      bookCta: 'تأیید اطلاعات و رزرو وقت',
      section: {
        basics: 'اطلاعات پایه و وضعیت شرکت',
        idea: 'چه و برای چه کسی',
        how: 'چگونه کار می‌کند',
        money: 'پول و تأمین مالی',
        special: 'موضوعات ویژه',
        contact: 'اطلاعات تماس و خلاصه',
      },
    },
    summary: {
      title: 'خلاصهٔ شما برای مشاور',
      createSummary: 'رزرو وقت با مشاور',
      whatSell: 'چه می‌فروشید',
      toWhom: 'به چه کسی',
      how: 'چگونه',
      companyFormSuggestion: 'نوع شرکت پیشنهادی',
      companyFormReasoning: 'دلیل',
      keyQuestionsForAdvisor: 'سؤالات برای مشاور',
      specialTopics: 'موضوعات ویژه',
      editHelper: 'می‌توانید قبل از ارسال به مشاور، این موارد را تنظیم کنید.',
      confirmButton: 'تأیید خلاصه',
    },
    errors: {
      chatFailed: 'ارسال پیام ناموفق بود. لطفاً دوباره تلاش کنید.',
      summaryFailed: 'ایجاد خلاصه انجام نشد. دوباره تلاش کنید یا متن گفتگو را به مشاور بدهید.',
    },
    loading: {
      generatingSummary: 'در حال ایجاد خلاصه…',
    },
    progress: {
      steps: {
        s1: 'اطلاعات پایه و وضعیت شرکت',
        s2: 'چه و برای چه کسی',
        s3: 'چگونه کار می‌کند',
        s4: 'پول و تأمین مالی',
        s5: 'موضوعات ویژه',
        s6: 'اطلاعات تماس و خلاصه',
      },
      stepLabel: 'گام {{current}} از {{total}}',
      about: 'حدود',
      minutes: 'دقیقه',
      left: 'باقی‌مانده',
    },
    onboarding: {
      documents: {
        heading: 'آیا قبلاً اسنادی دارید که شرکت فعلی یا برنامه‌ریزی‌شده شما را توصیف کند (مثلاً طرح کسب‌وکار، پرزنتیشن، اکسل مالی)؟',
        acceptedTypes: 'فرمت‌های قابل قبول: PDF، Word (.docx)، Excel (.xlsx/.xls)، PowerPoint (.pptx)',
        noDocumentsButton: 'من سندی ندارم',
        noFileSelected: 'فایلی انتخاب نشده است',
      },
    },
    
  },
};

const COOKIE_KEY = 'ui_lang';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

function isSupportedLanguage(lang: string | undefined | null): lang is UILanguage {
  return !!lang && (SUPPORTED_LANGUAGES as readonly string[]).includes(lang);
}

function normalizeLanguage(input: string | undefined | null): UILanguage {
  if (!input) return 'en';
  const lower = input.toLowerCase();
  // Extract primary subtag (e.g. "fi-FI" -> "fi")
  const primary = lower.split(/[-_]/)[0];
  if (isSupportedLanguage(primary)) return primary;
  if (isSupportedLanguage(lower)) return lower;
  return 'en';
}

function readCookieLang(): UILanguage | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + COOKIE_KEY + '=([^;]*)'));
  const value = match ? decodeURIComponent(match[1]) : null;
  return value ? normalizeLanguage(value) : null;
}

function writeCookieLang(lang: UILanguage) {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(lang)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}`;
}

function readLocalStorageLang(): UILanguage | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(COOKIE_KEY);
    return value ? normalizeLanguage(value) : null;
  } catch {
    return null;
  }
}

function writeLocalStorageLang(lang: UILanguage) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(COOKIE_KEY, lang);
  } catch {
    // ignore
  }
}

type I18nContextValue = {
  lang: UILanguage;
  setLang: (lang: UILanguage) => void;
  t: (key: string) => string;
  languageLocked: boolean;
  lockLanguage: () => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<UILanguage>('en');
  const [languageLocked, setLanguageLocked] = useState<boolean>(false);
  const LOCK_KEY = 'ui_lang_locked';

  // Hydrate language from cookie/localStorage/navigator
  useEffect(() => {
    const fromCookie = readCookieLang();
    const fromStorage = readLocalStorageLang();
    const fromNavigator =
      typeof navigator !== 'undefined'
        ? normalizeLanguage(navigator.language || (navigator.languages?.[0] ?? 'en'))
        : 'en';
    const initial = fromCookie ?? fromStorage ?? fromNavigator ?? 'en';
    setLangState(initial);
    // Hydrate lock
    try {
      const locked = typeof window !== 'undefined' ? window.localStorage.getItem(LOCK_KEY) : null;
      setLanguageLocked(locked === '1');
    } catch {
      setLanguageLocked(false);
    }
  }, []);

  const setLang = useCallback((next: UILanguage) => {
    if (languageLocked) return;
    setLangState(next);
    writeCookieLang(next);
    writeLocalStorageLang(next);
  }, []);

  const lockLanguage = useCallback(() => {
    setLanguageLocked(true);
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem(LOCK_KEY, '1');
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string): string => {
      const getFrom = (l: UILanguage): string | undefined => {
        const parts = key.split('.');
        let current: any = TRANSLATIONS[l];
        for (const part of parts) {
          if (current && typeof current === 'object' && part in current) {
            current = current[part];
          } else {
            return undefined;
          }
        }
        return typeof current === 'string' ? current : undefined;
      };
      // Prefer current language, then English, then the key itself
      return getFrom(lang) ?? getFrom('en') ?? key;
    },
    [lang]
  );

  const value = useMemo<I18nContextValue>(() => ({ lang, setLang, t, languageLocked, lockLanguage }), [lang, setLang, t, languageLocked, lockLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}

export const translations = TRANSLATIONS;
export const normalizeUILanguage = normalizeLanguage;


