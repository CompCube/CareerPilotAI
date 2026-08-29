"""
Golden dataset for the eval suite.

Unlike backend/tests/ (which mock the LLM and check code logic), these
cases call the REAL agents against the REAL API -- they measure output
QUALITY, not code correctness. Each case is crafted to isolate one
specific expected behavior, not to be a realistic full-length resume.
"""

from dataclasses import dataclass


@dataclass
class AnalyzerCase:
    name: str
    cv_text: str
    jd_text: str
    expect: str  # human-readable description of what a correct output looks like


ANALYZER_CASES: list[AnalyzerCase] = [
    AnalyzerCase(
        name="clear_match",
        cv_text=(
            "Experience: 5 years building backend services in Python. "
            "Led migration of a monolith to microservices using FastAPI. "
            "Comfortable with async programming and REST API design."
        ),
        jd_text=(
            "We need a backend engineer with strong Python experience. "
            "Must be comfortable building and maintaining REST APIs."
        ),
        expect="Python-related competency should be match_status='match'",
    ),
    AnalyzerCase(
        name="clear_gap",
        cv_text=(
            "Experience: Frontend developer for 4 years, building React "
            "interfaces and CSS animations. No backend or infra experience."
        ),
        jd_text=(
            "Requires strong Kubernetes experience -- must have deployed "
            "and managed production workloads on Kubernetes clusters."
        ),
        expect="Kubernetes-related competency should be match_status='gap'",
    ),
    AnalyzerCase(
        name="partial_adjacent",
        cv_text=(
            "Experience: Built and maintained web APIs using Flask for 3 years, "
            "including authentication, database integration, and deployment."
        ),
        jd_text="Looking for someone experienced with FastAPI specifically.",
        expect="FastAPI-related competency should be match_status='partial', not 'match' or 'gap'",
    ),
    AnalyzerCase(
        name="no_fabricated_evidence_strong_fit",
        cv_text=(
            "Experience: 6 years as a Unity technical artist. Built shader "
            "pipelines using Shader Graph, automated asset import tools in C#, "
            "and optimized draw calls for mobile VR titles."
        ),
        jd_text=(
            "Seeking a Technical Artist with Unity, Shader Graph, and C# "
            "tooling experience for mobile game development."
        ),
        expect="Every 'evidence' field must cite something literally present in the CV text above, never a technology not mentioned",
    ),
]

# Pair used for the fit_score ordering check (same JD, two very different CVs)
FIT_SCORE_JD = (
    "Senior Python backend engineer needed. Must have: Python, FastAPI, "
    "PostgreSQL, Docker, and experience leading technical projects."
)
FIT_SCORE_STRONG_CV = (
    "Experience: 7 years Python backend development. Led a team building "
    "FastAPI services backed by PostgreSQL, containerized with Docker, "
    "deployed to production serving millions of requests."
)
FIT_SCORE_WEAK_CV = (
    "Experience: 1 year as a marketing coordinator. Managed social media "
    "campaigns and wrote copy for email newsletters."
)


@dataclass
class TailorCase:
    name: str
    cv_text: str
    jd_text: str
    expect: str


TAILOR_CASES: list[TailorCase] = [
    TailorCase(
        name="no_fabrication_missing_metric",
        cv_text=(
            "Experience: Built an internal tool that automated manual data entry "
            "for the operations team. Used Python and pandas."
        ),
        jd_text="Looking for someone who has automated manual workflows with Python.",
        expect=(
            "Fast mode can't ask for the missing metric (% time saved, volume "
            "handled) -- the tailored bullet must NOT invent one that isn't in the CV"
        ),
    ),
    TailorCase(
        name="bullet_length_and_formatting",
        cv_text=(
            "Experience: Technical Artist at a game studio for 3 years. Designed "
            "a modular shader system used across 12 different projects, reducing "
            "onboarding time for new artists. Built a custom Unity editor tool for "
            "batch texture compression, cutting build times significantly."
        ),
        jd_text=(
            "Senior Technical Artist role. Needs shader pipeline experience and "
            "tool-building skills in Unity/C#."
        ),
        expect="Every professional_experience and achievements bullet stays within a 2-line-equivalent character budget",
    ),
    TailorCase(
        name="keyword_integration",
        cv_text=(
            "Experience: Full-stack developer for 4 years. Built React frontends "
            "and Node.js backends. Worked with PostgreSQL and Redis for caching."
        ),
        jd_text=(
            "We need a Full-Stack Engineer with React, Node.js, PostgreSQL, and "
            "Redis experience, plus strong TypeScript skills."
        ),
        expect="A meaningful share of the JD's top keywords appear naturally across the tailored sections",
    ),
]
