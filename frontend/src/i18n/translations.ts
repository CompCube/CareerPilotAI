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
    submitLoading: string
    submitInterview: string
    orUploadPdf: string
    extracting: string
  }
  analysis: {
    heading: string
    fitScoreLabel: string
    statusMatch: string
    statusPartial: string
    statusGap: string
    continue: string
  }
  tailor: {
    heading: string
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
    resumeLabel: string
    resumeEditableHint: string
    copy: string
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
      submitIdle: 'Analyze fit',
      submitLoading: 'Analyzing…',
      submitInterview: 'Start interview',
      orUploadPdf: 'or upload PDF',
      extracting: 'Extracting…',
    },
    analysis: {
      heading: 'Verdict',
      fitScoreLabel: 'FIT SCORE',
      statusMatch: 'Covered',
      statusPartial: 'Partial',
      statusGap: 'Gap',
      continue: 'Tailor the resume →',
    },
    tailor: {
      heading: 'Resume tailoring',
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
      subheading: 'You have the fit analysis and the tailored resume. Nothing else to do now.',
      resumeLabel: 'Your tailored resume',
      resumeEditableHint: 'Feel free to edit before copying -- this is a draft, not a final answer.',
      copy: 'Copy to clipboard',
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
      submitIdle: 'Analiza el encaje',
      submitLoading: 'Analizando…',
      submitInterview: 'Empezar entrevista',
      orUploadPdf: 'o sube un PDF',
      extracting: 'Extrayendo…',
    },
    analysis: {
      heading: 'Veredicto',
      fitScoreLabel: 'FIT SCORE',
      statusMatch: 'Cubierta',
      statusPartial: 'Parcial',
      statusGap: 'Hueco',
      continue: 'Retoca el currículum →',
    },
    tailor: {
      heading: 'Retoque del currículum',
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
      subheading: 'Tienes el análisis de encaje y el currículum retocado. No hace falta nada más ahora.',
      resumeLabel: 'Tu currículum retocado',
      resumeEditableHint: 'Puedes editarlo antes de copiarlo -- es un borrador, no una respuesta final.',
      copy: 'Copiar al portapapeles',
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
  },
}
