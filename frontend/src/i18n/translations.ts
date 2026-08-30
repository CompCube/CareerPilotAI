export type Language = 'en' | 'es'

export interface Translations {
  appName: string
  backToMenu: string
  mode: {
    subheading: string
    applyEyebrow: string
    applyTitle: string
    applyDesc: string
    interviewEyebrow: string
    interviewTitle: string
    interviewDesc: string
  }
  upload: {
    heading: string
    subheading: string
    cvLabel: string
    cvPlaceholder: string
    jdLabel: string
    jdPlaceholder: string
    submitIdle: string
    quickTailor: string
    submitLoading: string
    submitInterview: string
    orUploadPdf: string
    removeFile: string
    extracting: string
  }
  analysis: {
    heading: string
    fitScoreLabel: string
    companyLabel: string
    roleSummaryLabel: string
    idealCandidateLabel: string
    statusMatch: string
    statusPartial: string
    statusGap: string
    continue: string
  }
  tailor: {
    heading: string
    keywordsLabel: string
    keySkillsLabel: string
    atsScoreLabel: string
    atsIssuesLabel: string
    positioningLabel: string
    titleLabel: string
    subtitleLabel: string
    summaryLabel: string
    skillsSectionLabel: string
    achievementsKeyAchievements: string
    achievementsProjects: string
    experienceLabel: string
    copy: string
    copied: string
    finish: string
    thinking: string
    skipRemaining: string
    before: string
    after: string
    agentAsks: string
    summary: string
    answerPlaceholder: string
    send: string
    complete: string
  }
  done: {
    badge: string
    heading: string
    subheading: string
    copyAll: string
    copied: string
    note: string
    cta: string
  }
  interview: {
    heading: string
    subheading: string
    modeMixed: string
    modeRecruiter: string
    modeTechnical: string
    modeBehavioural: string
    start: string
    starting: string
    questionCounter: string
    interviewer: string
    you: string
    doneMsg: string
    answerPlaceholder: string
    send: string
  }
  errors: {
    generic: string
  }
  auth: {
    signIn: string
    logout: string
    welcomeBack: string
    profileSettings: string
    myApplications: string
    noName: string
    baseCvLabel: string
    baseCvHint: string
    saveCv: string
    saving: string
    saved: string
    backToList: string
    noApplicationsYet: string
    useBaseCv: string
    useLastApplication: string
    memoryLabel: string
    memoryHint: string
    clearMemory: string
    topSkillsLabel: string
    prepareInterviewForThis: string
    markAsApplied: string
    markedApplied: string
    deleteApplication: string
  }
  footer: {
    copyright: string
    viewSource: string
    privacy: string
    terms: string
  }
  legal: {
    privacy: { title: string; paragraphs: string[] }
    terms: { title: string; paragraphs: string[] }
  }
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'CareerPilot AI',
    backToMenu: '← Back to menu',
    mode: {
      subheading: 'What do you need today?',
      applyEyebrow: 'Before applying',
      applyTitle: 'Prepare your application',
      applyDesc: "Analyze your fit with the offer and tailor your resume with the right keywords.",
      interviewEyebrow: 'Interview scheduled',
      interviewTitle: 'Practice the interview',
      interviewDesc: 'Simulate the interview with real questions based on your offer and your resume.',
    },
    upload: {
      heading: 'Open the case file',
      subheading: 'Paste your resume and the job description. The analysis starts here.',
      cvLabel: 'Your resume',
      cvPlaceholder: 'Paste your resume text here...',
      jdLabel: 'Job offer',
      jdPlaceholder: 'Paste the job description text here...',
      submitIdle: 'Analyze Fit & Tailor Resume',
      quickTailor: 'Tailor Resume Directly',
      submitLoading: 'Analyzing…',
      submitInterview: 'Start interview',
      orUploadPdf: 'or upload PDF',
      removeFile: 'Remove',
      extracting: 'Extracting…',
    },
    analysis: {
      heading: 'Verdict',
      fitScoreLabel: 'FIT SCORE',
      companyLabel: 'About the company',
      roleSummaryLabel: 'What this offer is about',
      idealCandidateLabel: 'Who they\'re really hiring',
      statusMatch: 'Covered',
      statusPartial: 'Partial',
      statusGap: 'Gap',
      continue: 'Tailor the resume →',
    },
    tailor: {
      heading: 'Resume tailoring',
      keywordsLabel: 'Keywords they\'re looking for',
      keySkillsLabel: 'Key skills for this role',
      atsScoreLabel: 'ATS score',
      atsIssuesLabel: 'Structural issues found',
      positioningLabel: 'Positioning',
      titleLabel: 'Title',
      subtitleLabel: 'Subtitle',
      summaryLabel: 'Professional Summary',
      skillsSectionLabel: 'Skills',
      achievementsKeyAchievements: 'Key Achievements',
      achievementsProjects: 'Projects',
      experienceLabel: 'Professional Experience',
      copy: 'Copy',
      copied: 'Copied!',
      finish: 'Finish Tailoring →',
      thinking: 'Thinking…',
      skipRemaining: 'Skip remaining questions →',
      before: 'Before',
      after: 'Now',
      agentAsks: 'The agent asks',
      summary: 'Summary',
      answerPlaceholder: 'Your answer...',
      send: 'Send',
      complete: 'Finish application →',
    },
    done: {
      badge: 'Application ready',
      heading: "You're ready to apply",
      subheading: 'You have the fit analysis and the tailored resume. Copy each section below.',
      copyAll: 'Copy full resume',
      copied: 'Copied!',
      note: 'If you get called for an interview later, come back and activate practice — no need to do it now.',
      cta: 'Got the interview call → Practice now',
    },
    interview: {
      heading: 'The interview',
      subheading: 'Choose the mode and start whenever you are ready.',
      modeMixed: 'Mixed',
      modeRecruiter: 'Recruiter',
      modeTechnical: 'Technical',
      modeBehavioural: 'Behavioural',
      start: 'Start interview',
      starting: 'Preparing…',
      questionCounter: 'Question {n} / 5',
      interviewer: 'Interviewer',
      you: 'You',
      doneMsg: 'Interview completed. (Detailed evaluation arrives in Sprint 2 — Evaluate agent.)',
      answerPlaceholder: 'Your answer...',
      send: 'Send',
    },
    errors: {
      generic: 'Could not connect to the server.',
    },
    auth: {
      signIn: 'Sign in',
      logout: 'Log out',
      welcomeBack: 'Signed in as {name}.',
      profileSettings: 'Profile Settings',
      myApplications: 'My Applications',
      noName: 'No name set',
      baseCvLabel: 'Base resume',
      baseCvHint: "Saved once, reused when you check \"Use my base resume\" on a new application.",
      saveCv: 'Save',
      saving: 'Saving…',
      saved: 'Saved!',
      backToList: '← Back to list',
      noApplicationsYet: "No applications saved yet -- they'll show up here once you finish tailoring one while signed in.",
      useBaseCv: 'Use my base resume',
      useLastApplication: 'Use my last application',
      memoryLabel: 'What CareerPilot remembers about you',
      memoryHint: 'Auto-generated after each tailored resume -- updates itself, never edited by hand.',
      clearMemory: 'Clear',
      topSkillsLabel: 'Top skills they were looking for',
      prepareInterviewForThis: 'Prepare Interview for this application →',
      markAsApplied: 'Mark as applied',
      markedApplied: '✓ Applied',
      deleteApplication: 'Delete',
    },
    footer: {
      copyright: '© 2026 CareerPilot AI — portfolio project',
      viewSource: 'View source ↗',
      privacy: 'Privacy',
      terms: 'Terms',
    },
    legal: {
      privacy: {
        title: 'Privacy',
        paragraphs: [
          "This is a portfolio demo, not a production service — treat it accordingly and avoid pasting sensitive personal data.",
          'Your resume and job description text are sent to Anthropic\'s API to generate the analysis, tailored resume, and interview questions. No account, login, or persistent database exists in this version — everything lives only in your browser session and is lost when you close the tab or the backend restarts.',
          'Uploaded PDFs are parsed in memory to extract text and are never stored.',
          "No analytics, tracking, or third-party cookies are used.",
        ],
      },
      terms: {
        title: 'Terms',
        paragraphs: [
          'This is a personal portfolio project built to demonstrate AI engineering skills, not a commercial product. It is provided as-is, with no warranty of accuracy or availability.',
          'AI-generated content (fit analysis, tailored resume sections, interview questions) can be wrong or incomplete. Always review and verify before using it for a real job application.',
          'The Tailor agent is designed to never invent metrics or experience you did not provide, but no AI system is perfect — you are responsible for the accuracy of anything you submit to an employer.',
        ],
      },
    },
  },
  es: {
    appName: 'CareerPilot AI',
    backToMenu: '← Volver al menú',
    mode: {
      subheading: '¿Qué necesitas hoy?',
      applyEyebrow: 'Antes de postular',
      applyTitle: 'Prepara tu candidatura',
      applyDesc: 'Analiza tu encaje con la oferta y adapta tu currículum con las palabras clave correctas.',
      interviewEyebrow: 'Entrevista concertada',
      interviewTitle: 'Practica la entrevista',
      interviewDesc: 'Simula la entrevista con preguntas reales basadas en tu oferta y tu currículum.',
    },
    upload: {
      heading: 'Abre el expediente',
      subheading: 'Pega tu currículum y la descripción de la oferta. El análisis empieza aquí.',
      cvLabel: 'Tu currículum',
      cvPlaceholder: 'Pega aquí el texto de tu currículum...',
      jdLabel: 'Oferta de trabajo',
      jdPlaceholder: 'Pega aquí el texto de la oferta...',
      submitIdle: 'Analizar encaje y retocar CV',
      quickTailor: 'Retocar CV directamente',
      submitLoading: 'Analizando…',
      submitInterview: 'Empezar entrevista',
      orUploadPdf: 'o sube un PDF',
      removeFile: 'Quitar',
      extracting: 'Extrayendo…',
    },
    analysis: {
      heading: 'Veredicto',
      fitScoreLabel: 'FIT SCORE',
      companyLabel: 'Sobre la empresa',
      roleSummaryLabel: 'De qué trata esta oferta',
      idealCandidateLabel: 'A quién buscan realmente',
      statusMatch: 'Cubierta',
      statusPartial: 'Parcial',
      statusGap: 'Hueco',
      continue: 'Retoca el currículum →',
    },
    tailor: {
      heading: 'Retoque del currículum',
      keywordsLabel: 'Palabras clave que buscan',
      keySkillsLabel: 'Skills clave para este puesto',
      atsScoreLabel: 'Puntuación ATS',
      atsIssuesLabel: 'Problemas estructurales encontrados',
      positioningLabel: 'Posicionamiento',
      titleLabel: 'Título',
      subtitleLabel: 'Subtítulo',
      summaryLabel: 'Resumen Profesional',
      skillsSectionLabel: 'Skills',
      achievementsKeyAchievements: 'Logros Clave',
      achievementsProjects: 'Proyectos',
      experienceLabel: 'Experiencia Profesional',
      copy: 'Copiar',
      copied: '¡Copiado!',
      finish: 'Finalizar Retoque →',
      thinking: 'Pensando…',
      skipRemaining: 'Saltar preguntas restantes →',
      before: 'Antes',
      after: 'Ahora',
      agentAsks: 'El agente pregunta',
      summary: 'Resumen',
      answerPlaceholder: 'Tu respuesta...',
      send: 'Enviar',
      complete: 'Finalizar candidatura →',
    },
    done: {
      badge: 'Candidatura lista',
      heading: 'Ya puedes postular',
      subheading: 'Tienes el análisis de encaje y el currículum retocado. Copia cada sección abajo.',
      copyAll: 'Copiar currículum completo',
      copied: '¡Copiado!',
      note: 'Si más adelante te llaman para una entrevista, vuelve aquí y activa la práctica — no hace falta hacerlo ahora.',
      cta: 'Me han llamado para la entrevista → Practicar ahora',
    },
    interview: {
      heading: 'La entrevista',
      subheading: 'Elige el modo y empieza cuando quieras.',
      modeMixed: 'Mixta',
      modeRecruiter: 'Recruiter',
      modeTechnical: 'Técnica',
      modeBehavioural: 'Conductual',
      start: 'Empezar entrevista',
      starting: 'Preparando…',
      questionCounter: 'Pregunta {n} / 5',
      interviewer: 'Entrevistador',
      you: 'Tú',
      doneMsg: 'Entrevista completada. (La evaluación detallada llega en el Sprint 2 — Evaluate agent.)',
      answerPlaceholder: 'Tu respuesta...',
      send: 'Enviar',
    },
    errors: {
      generic: 'No se ha podido conectar con el servidor.',
    },
    auth: {
      signIn: 'Iniciar sesión',
      logout: 'Cerrar sesión',
      welcomeBack: 'Sesión iniciada como {name}.',
      profileSettings: 'Ajustes de perfil',
      myApplications: 'Mis candidaturas',
      noName: 'Sin nombre',
      baseCvLabel: 'Currículum base',
      baseCvHint: 'Se guarda una vez, y se reutiliza cuando marcas "Usar mi currículum base" en una nueva candidatura.',
      saveCv: 'Guardar',
      saving: 'Guardando…',
      saved: '¡Guardado!',
      backToList: '← Volver a la lista',
      noApplicationsYet: 'Aún no tienes candidaturas guardadas -- aparecerán aquí cuando termines de retocar una estando conectado.',
      useBaseCv: 'Usar mi currículum base',
      useLastApplication: 'Usar mi última candidatura',
      memoryLabel: 'Lo que CareerPilot recuerda de ti',
      memoryHint: 'Se genera solo tras cada CV retocado -- se actualiza sola, no se edita a mano.',
      clearMemory: 'Borrar',
      topSkillsLabel: 'Skills principales que buscaban',
      prepareInterviewForThis: 'Preparar entrevista para esta candidatura →',
      markAsApplied: 'Marcar como enviada',
      markedApplied: '✓ Enviada',
      deleteApplication: 'Eliminar',
    },
    footer: {
      copyright: '© 2026 CareerPilot AI — proyecto de portfolio',
      viewSource: 'Ver código ↗',
      privacy: 'Privacidad',
      terms: 'Términos',
    },
    legal: {
      privacy: {
        title: 'Privacidad',
        paragraphs: [
          'Esto es una demo de portfolio, no un servicio en producción — trátalo como tal y evita pegar datos personales sensibles.',
          'El texto de tu currículum y la oferta de trabajo se envían a la API de Anthropic para generar el análisis, el currículum retocado y las preguntas de entrevista. Esta versión no tiene cuentas, login ni base de datos persistente — todo vive solo en tu sesión del navegador y se pierde al cerrar la pestaña o si el servidor se reinicia.',
          'Los PDFs que subes se procesan en memoria para extraer el texto y nunca se guardan.',
          'No se usan analíticas, seguimiento ni cookies de terceros.',
        ],
      },
      terms: {
        title: 'Términos',
        paragraphs: [
          'Este es un proyecto personal de portfolio construido para demostrar habilidades de ingeniería de IA, no un producto comercial. Se ofrece tal cual, sin garantía de precisión ni disponibilidad.',
          'El contenido generado por IA (análisis de encaje, secciones del currículum, preguntas de entrevista) puede ser incorrecto o incompleto. Revísalo y verifícalo siempre antes de usarlo en una candidatura real.',
          'El agente Tailor está diseñado para no inventar nunca métricas o experiencia que no hayas aportado, pero ningún sistema de IA es perfecto — eres responsable de la exactitud de lo que envíes a un empleador.',
        ],
      },
    },
  },
}
