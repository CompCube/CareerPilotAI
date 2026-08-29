CareerPilot AI

I built CareerPilot AI in August 2026 as a hands-on way to move from Technical
Art and Unity work into AI Engineering, not as a client project. The goal was
to solve a problem I actually had: knowing whether my resume genuinely fit a
job description, and being able to adapt it honestly instead of guessing. The
first plan was heavier than it needed to be, with full authentication, a
vector database, and a multi-container deployment sketched out before any
code existed. I cut all three for the first version and kept only what the
core problem required. The Resume Tailor agent later went through a full
rewrite: the first version rewrote bullets in one pass, the second is a
4-phase conversation that asks about each job requirement individually before
writing anything, with a faster path added afterward for offers where the
user already knows they're a strong fit.

The app has two entry points: preparing an application, or practicing an
interview for one already scheduled. Preparing an application runs a resume
through an Analyzer agent, which ranks the job's requirements by real signal
in the text and scores the resume against each one with cited evidence, then
a Resume Tailor agent that extracts the role's top keywords, audits the
resume's ATS structure, asks about the requirements the resume doesn't
already cover, and assembles a tailored resume section by section, each
bullet built with the XYZ formula. Practicing an interview runs a fixed
five-question mock interview in whichever mode fits the role. Nothing is
shared between agents through memory or a database, the Analyzer's output is
passed once as input to the Tailor, and everything else lives only for the
length of that session.

There's no login and no user accounts in this version, a deliberate scope
decision rather than an oversight, so there's also nothing to store about
anyone beyond their active session. Cost is controlled with a per-IP rate
limit in the API and a hard spending cap set directly with the model
provider, since this is a personal tool rather than a service with paying
users.

The frontend is React and TypeScript on Vercel; the backend is Python and
FastAPI on Railway, deliberately run as a persistent process rather than
serverless, since the agents' in-memory conversation state needs a server
that doesn't disappear between requests. It runs on Claude Haiku 4.5, chosen
for cost given the length of a full Tailor conversation, with the model name
kept in configuration rather than code. There's no agent framework
underneath it (no LangChain, no LangGraph), the phase logic is hand-written,
which was a deliberate choice, not an oversight. At this scale a 4-phase
conversation is simple enough that writing the state machine by hand forced
me to actually understand agent orchestration instead of trusting a
library's abstraction for something this specific, and every state
transition stays a readable line of Python instead of a framework's own
debugging surface. The design principle throughout is that application code
decides what happens next in a conversation and the model only decides what
to say, which is what makes a fifteen-plus-turn conversation with a small
model hold together reliably.

Building this meant working through the practical side of shipping LLM
features rather than just calling an API: designing multi-step agent
conversations where code, not the model, owns the state machine; treating
every model response as untrusted input that gets schema-validated and
retried rather than assumed correct, which caught two real bugs in
production logs; writing prompts with explicit rules against inventing
information, with a defined fallback of asking instead of guessing; and
defending against prompt injection in every place user-supplied text reaches
the model. It's a small system, but every one of those decisions was made on
purpose, not by default.
