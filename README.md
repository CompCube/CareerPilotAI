# CareerPilot AI (v0.1)

Plataforma que analitza un CV i una oferta de feina, calcula l'ajust real,
adapta el CV honestament (sense inventar mètriques), i simula una entrevista
amb preguntes generades dinàmicament.

Vegeu `careerpilot-ai-design-doc.md` (arrel del repo, o adjunt al Notion del
projecte) per a l'arquitectura completa, les decisions de disseny, i com
explicar-ho en una entrevista.

## Estat (Sprint 1)

- ✅ Backend: Analyzer, Resume Tailor i Interview agents — fets i provats
  (LLM simulat, tests a `backend/tests/`)
- ✅ Frontend: React + TS + Tailwind, 4 pantalles, build net
- ⏳ Pendent: desplegament (backend a Railway/Render, frontend a Vercel)
- ⏳ Pendent: primera prova real contra l'API d'Anthropic (tot provat fins
  ara amb respostes simulades)

## Estructura

```
careerpilot-ai/
├── backend/     FastAPI + Anthropic Claude
└── frontend/    React + TypeScript + Tailwind
```

## Arrencar en local

**Backend:**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # afegeix la teva ANTHROPIC_API_KEY
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```
