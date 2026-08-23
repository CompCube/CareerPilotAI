"""
Resume Tailor Agent v2.

Four phases: extract -> interrogate -> deepen -> assemble -> complete.

Design principle (same as the Interview agent): the CODE decides which
phase is active, which competency/section comes next, and when to stop --
the MODEL only decides content within whatever phase it's asked about.
This is what makes a multi-phase agent reliable instead of hoping the LLM
self-tracks its own progress correctly.
"""

from dataclasses import dataclass, field

from app.models.schemas import (
    ATSIssue,
    AnalyzeResponse,
    CompetencyMatch,
    TailorAssembleStartOutput,
    TailorExtractOutput,
    TailorPhase,
    TailorQuestionOutput,
    TailorResponse,
    TailorSectionOutput,
    TailorSections,
)
from app.prompts.tailor_prompts import (
    TAILOR_ASSEMBLE_SECTION_PROMPT,
    TAILOR_ASSEMBLE_START_PROMPT,
    TAILOR_CLARIFICATION_CHECK_PROMPT,
    TAILOR_DEEPEN_PROMPT,
    TAILOR_EXTRACT_PROMPT,
    TAILOR_INTERROGATE_PROMPT,
    build_assemble_context,
    build_deepen_message,
    build_extract_message,
    build_interrogate_message,
    build_section_request,
)
from app.prompts.language import language_instruction
from app.services import session_store
from app.services.structured_output import call_llm_structured

SECTION_ORDER = [
    "title",
    "subtitle",
    "professional_summary",
    "skills",
    "achievements",
    "professional_experience",
]
MAX_DEEPEN_QUESTIONS = 2


@dataclass
class _TailorState:
    """Per-session accumulated state. In-memory only, same documented
    limitation as session_store: lost on server restart, fine for v0.1."""

    cv_text: str
    jd_text: str
    competencies: list[CompetencyMatch]
    language: str = "en"
    phase: TailorPhase = "extract"
    requirement_idx: int = 0
    deepen_count: int = 0
    top_keywords: list[str] = field(default_factory=list)
    key_skills: list[str] = field(default_factory=list)
    ats_score: int | None = None
    ats_issues: list[ATSIssue] = field(default_factory=list)
    positioning_reframe: str | None = None
    section_strategy_note: str | None = None
    sections: TailorSections = field(default_factory=TailorSections)
    section_idx: int = 0


_tailor_states: dict[str, _TailorState] = {}


def _build_response(state: _TailorState, session_id: str, agent_message: str, done: bool = False) -> TailorResponse:
    return TailorResponse(
        session_id=session_id,
        phase=state.phase,
        agent_message=agent_message,
        top_keywords=state.top_keywords,
        key_skills=state.key_skills,
        ats_score=state.ats_score,
        ats_issues=state.ats_issues,
        positioning_reframe=state.positioning_reframe,
        section_strategy_note=state.section_strategy_note,
        sections=state.sections,
        done=done,
    )


# ---------------------------------------------------------------------------
# Phase A -- Extract
# ---------------------------------------------------------------------------


def start_tailor_session(
    cv_text: str, jd_text: str, analysis: AnalyzeResponse, language: str = "en"
) -> TailorResponse:
    session_id = session_store.create_session()
    sorted_competencies = sorted(analysis.competencies, key=lambda c: c.priority)
    state = _TailorState(
        cv_text=cv_text, jd_text=jd_text, competencies=sorted_competencies, language=language
    )
    _tailor_states[session_id] = state

    extract_result, _raw = call_llm_structured(
        system_prompt=TAILOR_EXTRACT_PROMPT + language_instruction(state.language),
        messages=[{"role": "user", "content": build_extract_message(cv_text, jd_text)}],
        response_model=TailorExtractOutput,
        prompt_name="tailor.extract",
        max_tokens=2500,
    )
    state.top_keywords = extract_result.top_keywords
    state.key_skills = extract_result.key_skills
    state.ats_score = extract_result.ats_score
    state.ats_issues = extract_result.ats_issues

    state.phase = "interrogate"
    if not state.competencies:
        # Defensive: no competencies to walk through, skip straight to deepen
        state.phase = "deepen"
        return _ask_deepen(session_id, state)
    return _ask_next_requirement(session_id, state)


# ---------------------------------------------------------------------------
# Phase B -- Interrogate
# ---------------------------------------------------------------------------


def _ask_next_requirement(session_id: str, state: _TailorState) -> TailorResponse:
    competency = state.competencies[state.requirement_idx]
    session_store.append_message(
        session_id, "user", build_interrogate_message(competency.competency, state.jd_text)
    )
    result, raw = call_llm_structured(
        system_prompt=TAILOR_INTERROGATE_PROMPT + language_instruction(state.language),
        messages=session_store.get_history(session_id),
        response_model=TailorQuestionOutput,
        prompt_name="tailor.interrogate",
        max_tokens=400,
    )
    session_store.append_message(session_id, "assistant", raw)
    return _build_response(state, session_id, agent_message=result.agent_message)


# ---------------------------------------------------------------------------
# Phase C -- Deepen
# ---------------------------------------------------------------------------


def _ask_deepen(session_id: str, state: _TailorState) -> TailorResponse:
    session_store.append_message(session_id, "user", build_deepen_message(state.cv_text, state.jd_text))
    result, raw = call_llm_structured(
        system_prompt=TAILOR_DEEPEN_PROMPT + language_instruction(state.language),
        messages=session_store.get_history(session_id),
        response_model=TailorQuestionOutput,
        prompt_name="tailor.deepen",
        max_tokens=400,
    )
    session_store.append_message(session_id, "assistant", raw)
    if not result.has_question:
        return _start_assemble(session_id, state)
    return _build_response(state, session_id, agent_message=result.agent_message)


# ---------------------------------------------------------------------------
# Phase D -- Assemble
# ---------------------------------------------------------------------------


def _start_assemble(session_id: str, state: _TailorState) -> TailorResponse:
    state.phase = "assemble"
    result, _raw = call_llm_structured(
        system_prompt=TAILOR_ASSEMBLE_START_PROMPT + language_instruction(state.language),
        messages=[
            {
                "role": "user",
                "content": build_assemble_context(
                    state.cv_text, state.jd_text, state.top_keywords, state.key_skills
                ),
            }
        ],
        response_model=TailorAssembleStartOutput,
        prompt_name="tailor.assemble_start",
        max_tokens=500,
    )
    state.positioning_reframe = result.positioning_reframe
    state.section_strategy_note = result.section_strategy_note
    state.sections.achievements_label = result.section_strategy
    state.section_idx = 0
    return _ask_section(session_id, state)


def _store_section(state: _TailorState, section_name: str, content: str) -> None:
    setattr(state.sections, section_name, content)


def _ask_section(session_id: str, state: _TailorState, extra_context: str | None = None) -> TailorResponse:
    section_name = SECTION_ORDER[state.section_idx]
    context = build_assemble_context(state.cv_text, state.jd_text, state.top_keywords, state.key_skills)
    request = build_section_request(section_name, state.positioning_reframe or "", state.section_strategy_note or "")
    user_content = f"{context}\n\n{request}"
    if extra_context:
        user_content += f"\n\nAdditional info from candidate: {extra_context}"

    result, _raw = call_llm_structured(
        system_prompt=TAILOR_ASSEMBLE_SECTION_PROMPT + language_instruction(state.language),
        messages=[{"role": "user", "content": user_content}],
        response_model=TailorSectionOutput,
        prompt_name=f"tailor.assemble.{section_name}",
        max_tokens=1200,
    )

    if result.status == "needs_info":
        return _build_response(state, session_id, agent_message=result.agent_message)

    _store_section(state, section_name, result.section_content)
    state.section_idx += 1

    if state.section_idx >= len(SECTION_ORDER):
        state.phase = "complete"
        return _build_response(
            state, session_id, agent_message="Your tailored resume is ready.", done=True
        )
    return _ask_section(session_id, state)


# ---------------------------------------------------------------------------
# Comprovacio de claredat -- compartida per Interrogate i Deepen
# ---------------------------------------------------------------------------


def _check_clarification(
    session_id: str, state: _TailorState, user_message: str
) -> TailorQuestionOutput:
    session_store.append_message(session_id, "user", user_message)
    result, raw = call_llm_structured(
        system_prompt=TAILOR_CLARIFICATION_CHECK_PROMPT + language_instruction(state.language),
        messages=session_store.get_history(session_id),
        response_model=TailorQuestionOutput,
        prompt_name="tailor.clarification_check",
        max_tokens=400,
    )
    session_store.append_message(session_id, "assistant", raw)
    return result


# ---------------------------------------------------------------------------
# Entry point for continuing an existing session
# ---------------------------------------------------------------------------


def continue_tailor_session(session_id: str, user_message: str) -> TailorResponse:
    state = _tailor_states.get(session_id)
    if state is None:
        raise KeyError(f"Unknown tailor session: {session_id}")

    if state.phase == "interrogate":
        check = _check_clarification(session_id, state, user_message)
        if check.is_clarification:
            return _build_response(state, session_id, agent_message=check.agent_message)
        state.requirement_idx += 1
        if state.requirement_idx < len(state.competencies):
            return _ask_next_requirement(session_id, state)
        state.phase = "deepen"
        state.deepen_count = 0
        return _ask_deepen(session_id, state)

    if state.phase == "deepen":
        check = _check_clarification(session_id, state, user_message)
        if check.is_clarification:
            return _build_response(state, session_id, agent_message=check.agent_message)
        state.deepen_count += 1
        if state.deepen_count >= MAX_DEEPEN_QUESTIONS:
            return _start_assemble(session_id, state)
        return _ask_deepen(session_id, state)

    if state.phase == "assemble":
        return _ask_section(session_id, state, extra_context=user_message)

    raise RuntimeError(f"Cannot continue a session in phase: {state.phase}")
