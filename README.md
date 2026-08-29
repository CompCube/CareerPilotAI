# CareerPilot AI

A deployed multi-agent app that analyzes how well a resume fits a job
description, tailors the resume section by section without inventing
experience, and runs a mock interview for the role.

**Live:** https://career-pilot-ai-tan-ten.vercel.app
**Portfolio write-up:** see `careerpilot-ai-portfolio-copy.md`
**Design decisions:** see `careerpilot-ai-design-doc.md`

## What it does

- **Analyzer** — ranks a job description's requirements by real signal
  (repetition, placement, required vs. nice-to-have), scores the resume
  against each one with cited evidence, and writes a plain-language summary
  of the role and the ideal candidate.
- **Resume Tailor** — a 4-phase conversation (extract keywords/ATS audit →
  ask about each requirement → optional follow-ups → assemble the resume
  section by section). A "fast path" skips straight to assembly for offers
  the user already knows they're a strong fit for.
- **Interview** — a fixed 5-question mock interview (recruiter / technical /
  behavioural / mixed), question content from the model, question count
  controlled by application code.

No agent framework underneath any of this — the phase/turn logic is
hand-written Python, a deliberate choice explained in the portfolio write-up.

## Structure

```
careerpilot-ai/
├── backend/     FastAPI + Anthropic Claude Haiku 4.5
│   ├── app/     agents, prompts, services, API routes
│   ├── tests/   20 tests, mocked LLM, check code logic and error handling
│   └── evals/   eval suite, REAL API calls, check output quality
└── frontend/    React + TypeScript + Tailwind, deployed on Vercel
```

## Running locally

**Backend:**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # add your ANTHROPIC_API_KEY
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## Testing

Two different kinds of checks live in this repo, and they check different things:

**`backend/tests/`** — 20 tests, LLM responses mocked, zero API cost. These
check that the *code* is correct: state machine transitions, retry logic,
error handling, schema validation. Run with:
```bash
cd backend
for f in tests/test_*.py; do python "$f"; done
```

**`backend/evals/`** — an eval suite that calls the real Anthropic API
against a small golden dataset, to measure output *quality* rather than
code correctness: does the Analyzer's cited evidence actually appear in the
resume, does the Tailor ever invent a metric that isn't in the source CV,
do generated bullets avoid AI-sounding phrasing, does a strong-fit resume
score higher than a weak-fit one against the same job description. Includes
one LLM-as-judge check (a separate model call scoring bullet naturalness).
Costs a few cents to run. Run with:
```bash
cd backend
python evals/run_evals.py   # writes evals/report.md
```

## Production readiness (honest assessment)

This is a portfolio project, not a production service, and that's a
deliberate scope decision, not an oversight. If it were to serve real users
at scale, in rough order of severity:

**Would break with real traffic:**
- Session/conversation state lives in an in-process Python dictionary, not
  a database. It's lost on server restart, and wouldn't survive running more
  than one backend instance.
- The Anthropic spend cap is a single global limit, not per-user — one
  heavy user can take the API down for everyone else.
- No per-user usage quotas (there are no user accounts at all).

**Would work but carries real risk:**
- No CI pipeline running tests automatically before merge.
- No error tracking (e.g. Sentry) — failures are only visible in raw logs.
- No load testing has been done.
- Per-IP rate limiting is easy to bypass with rotating IPs/VPNs.

**Real but lower-severity gaps:**
- No CAPTCHA/bot protection, no end-to-end browser tests, no OCR support
  for scanned (image-only) PDF uploads.

None of this blocks the project's purpose as a portfolio piece, but pretending
these gaps don't exist would be worse than naming them.
