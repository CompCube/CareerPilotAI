# CareerPilot AI — Document de Disseny (v0.1)

**Autor:** Jordi Altisèn
**Data:** Agost 2026 — actualitzat, Sprint 1 en curs (Bloc 1 fet i provat)
**Propòsit:** Document de referència per entendre i poder explicar les decisions d'arquitectura del projecte en una entrevista tècnica.

---

## 1. Visió general

CareerPilot AI és una plataforma que analitza un CV i una oferta de feina, calcula el grau d'ajust (fit), ajuda a adaptar (tailor) el CV a l'oferta, i simula una entrevista amb preguntes generades dinàmicament.

**v0.1 (Sprint 1, aquesta setmana):** Analyzer → Resume Tailor → Interview. Sense autenticació ni base de dades persistent. **Evaluate ajornat a Sprint 2** (té més sentit construir-lo amb converses d'entrevista reals per calibrar-lo).

**Visió a llarg termini:** sistema multi-agent complet (Resume Agent, Job Description Agent, Interview Agent, Feedback Agent, etc.) amb memòria persistent i cerca semàntica entre entrevistes passades.

---

## 2. Estat actual del Sprint 1

| Tasca | Estat |
|---|---|
| Backend skeleton + seguretat bàsica | ✅ Fet i provat |
| Analyzer agent + `/analyze` | ⏳ Pendent |
| Resume Tailor agent + endpoint | ⏳ Pendent |
| Interview agent + `/interview` | ⏳ Pendent |
| Frontend bàsic connectat | ⏳ Pendent |
| Deploy backend | ⏳ Pendent |
| Deploy frontend | ⏳ Pendent |

**Verificat de veritat, no assumit:** l'app arrenca, `/health` respon `200`, i s'ha comprovat amb peticions reals que un origen no autoritzat rep `400` sense capçalera CORS, mentre que l'origen del futur frontend rep permís explícit.

---

## 3. Arquitectura del sistema

```
┌─────────────────────┐        HTTPS        ┌──────────────────────────────┐
│   Frontend            │ ──────────────────▶│   Backend (FastAPI)            │
│   React + TS +        │                      │                                │
│   Tailwind (Vercel)   │ ◀────────────────── │   (Railway/Render)             │
└─────────────────────┘                      │                                │
                                              │  agents/ (pendents)            │
                                              │  ├── analyzer_agent.py         │
                                              │  ├── tailor_agent.py           │
                                              │  └── interview_agent.py        │
                                              │        │                       │
                                              │        ▼                       │
                                              │  services/llm_service.py ✅    │
                                              │  (única capa que parla amb IA) │
                                              └──────────────┬─────────────────┘
                                                              ▼
                                                  ┌───────────────────────┐
                                                  │   LLM API (Claude Haiku)│
                                                  │   clau protegida al     │
                                                  │   backend                │
                                                  └───────────────────────┘
```

**Endpoints:**
- `GET /health` — ✅ fet
- `POST /analyze` — rep CV + Job Description, retorna perfil ideal, skills ordenades per importància, fit score
- `POST /tailor` — conversacional (com `/interview`): reescriu bullets amb XYZ, pregunta si li falta informació
- `POST /interview` — conversa d'entrevista, historial en memòria de sessió

---

## 4. Estructura de carpetes real (tal com s'ha construït)

```
backend/
├── app/
│   ├── main.py                    ✅ arrenca FastAPI, CORS, gestor d'errors
│   ├── api/
│   │   └── routes.py              ✅ /health fet; /analyze /tailor /interview pendents
│   ├── agents/                    ⏳ buit, es va omplint per tasca
│   │   ├── analyzer_agent.py
│   │   ├── tailor_agent.py
│   │   └── interview_agent.py
│   ├── services/
│   │   └── llm_service.py         ✅ crida a Claude + retry/backoff + logging
│   ├── prompts/                   ⏳ buit, es va omplint per tasca
│   │   ├── analyzer_prompts.py
│   │   ├── tailor_prompts.py
│   │   └── interview_prompts.py
│   ├── models/
│   │   └── schemas.py             ⏳ pendent (es crea amb el primer endpoint real)
│   ├── core/
│   │   ├── config.py              ✅ variables d'entorn, falla ràpid si en falta alguna
│   │   └── limiter.py             ✅ rate limit per IP (mòdul separat per evitar imports circulars)
│   └── utils/
│       └── validation.py          ✅ valida fitxers pujats per contingut real, no per extensió
├── requirements.txt                ✅
├── .env.example                    ✅
└── .gitignore                      ✅ (.env mai es puja a Git)
```

**Per què `limiter.py` és un mòdul separat:** tant `main.py` com `routes.py` necessiten el limiter, i `main.py` importa `routes.py` — si el limiter visqués dins de `main.py`, hi hauria un import circular. Petit detall, però és exactament el tipus de cosa que un revisor sènior mira.

---

## 5. Els 3 agents de la v0.1 (disseny — implementació pendent)

### 5.1 Analyzer Agent
Basat en `decode.md` de la skill `interview-coach`, simplificada a un sol pas: parseja la JD, prioritza per senyal (repetició, ordre, required vs. nice-to-have), compara amb el CV (`Match`/`Partial`/`Gap` amb evidència), calcula un fit score ponderat.

### 5.2 Resume Tailor Agent
Basat en `resume.md`: format XYZ per bullet, màxim 2 línies, integra keywords del JD només si són certes, **pregunta abans d'inventar** — per això és conversacional, no un sol POST.

### 5.3 Interview Agent
Preguntes una a una, historial de conversa en memòria de sessió.

---

## 6. Seguretat

| Risc | Mitigació | Estat |
|---|---|---|
| Clau d'API exposada al client | Viu només al backend | ✅ |
| Trànsit interceptat | HTTPS automàtic (Vercel/Railway) | ⏳ (pendent de deploy) |
| Secrets al repo | `.env` mai commitejat | ✅ |
| Abús de cost (sense auth) | Rate limit per IP al backend | ✅ |
| Prompt injection via CV/JD | System prompt: contingut = dades, mai instruccions | ⏳ (es fa amb l'Analyzer agent) |
| Fitxers maliciosos pujats | Validació de mida + contingut real (magic bytes) | ✅ |
| Orígens no autoritzats | CORS restringit, provat amb petició real | ✅ |
| Cost fora de control | Límit de despesa a la consola d'Anthropic ($1) | ⏳ (ho fa Jordi manualment) |
| Dades personals (CV = PII) als logs | No es guarda el CV sencer als logs | ✅ (per disseny, sense DB) |

---

## 7. Decisions descartades — deliberadament, per ara

| Descartat a v0.1 | Per què ara no | Quan té sentit afegir-ho |
|---|---|---|
| Evaluate agent | Millor calibrar-lo amb converses reals ja capturades | Sprint 2 |
| Vector DB (ChromaDB) | RAG té sentit amb *molts* documents; un CV+JD caben al context | Quan hi hagi historial a buscar |
| Autenticació (JWT) | No hi ha usuaris múltiples en una demo personal | Quan hi hagi usuaris reals |
| Base de dades persistent | Sense usuaris, no cal persistir res | Junt amb l'autenticació |
| Docker Compose multi-servei | Un sol servei és més ràpid de desplegar | Amb múltiples serveis reals |

---

## 8. Com parlar-ne en una entrevista — resum

1. **Problema:** ajudar candidats a preparar-se per entrevistes analitzant el seu fit real, adaptant el CV honestament, i practicant amb preguntes reals.
2. **Arquitectura:** backend prim que separa agent / servei / prompts, pensat des del dia 1 per créixer cap a multi-agent sense refactor dolorós.
3. **Diferenciador:** validació d'outputs, observabilitat de costos, resiliència, i seguretat conscient des del primer sprint (rate limiting, CORS provat, validació de fitxers per contingut).
4. **Escalat conscient:** vector DB, auth, i fins i tot l'Evaluate agent descartats per a v0.1 — prioritzant el que aporta valor real primer.
5. **Resume Tailor:** mai inventa mètriques, pregunta quan li falta informació — decisió de producte i d'ètica, no només tècnica.

---

## 9. Roadmap futur

- **Sprint 2:** Evaluate agent (amb dades reals), persistència (DB), autenticació bàsica
- **Sprint 3:** vector DB per cercar entre entrevistes passades
- **Sprint 4:** multi-agent real (agents separats per Resume, Feedback, Cover Letter)
- **Sprint 5:** evals automatitzats
