"""
Manual test of the full Tailor v2 state machine -- mocked LLM, zero real cost.

Exercises: extract -> interrogate (N competencies, incl. a clarification
detour) -> deepen (up to cap) -> assemble (6 sections, one needs_info
mid-way) -> complete.
"""

import sys
from unittest.mock import patch

sys.path.insert(0, ".")

from app.agents.tailor_agent import continue_tailor_session, start_tailor_session  # noqa: E402
from app.models.schemas import AnalyzeResponse, CompetencyMatch  # noqa: E402

EXTRACT_RESPONSE = """{
  "top_keywords": ["Unity", "Shader Graph", "C#", "Pipeline"],
  "key_skills": ["Technical Art", "Shaders", "Automation"],
  "ats_score": 72,
  "ats_issues": [{"issue": "Skills before Experience", "why_it_matters": "hurts keyword-context matching", "fix": "reorder sections"}]
}"""

QUESTION_RESPONSE = '{"has_question": true, "is_clarification": false, "agent_message": "Tell me about your experience with X."}'
NOT_A_CLARIFICATION = '{"is_clarification": false, "agent_message": ""}'
IS_A_CLARIFICATION = '{"is_clarification": true, "agent_message": "By that I mean hands-on shipping experience. So -- do you have that?"}'
NO_MORE_DEEPEN_RESPONSE = '{"has_question": false, "is_clarification": false, "agent_message": ""}'

ASSEMBLE_START_RESPONSE = """{
  "positioning_reframe": "Reads as X, should read as Y.",
  "section_strategy": "projects",
  "section_strategy_note": "Solo technical ownership, no team management evidence."
}"""

SECTION_COMPLETE = lambda content: f'{{"status": "section_complete", "section_content": "{content}", "agent_message": "Done."}}'
SECTION_NEEDS_INFO = '{"status": "needs_info", "section_content": "", "agent_message": "What metric can you share for this project?"}'


def make_analysis(n_competencies: int) -> AnalyzeResponse:
    return AnalyzeResponse(
        role_summary="A role about building things.",
        ideal_candidate_profile="Someone who builds things well.",
        company_profile="A company that builds things.",
        fit_score=75,
        competencies=[
            CompetencyMatch(
                competency=f"Skill {i}",
                priority=i + 1,
                type="screening",
                match_status="partial",
                evidence="some evidence",
            )
            for i in range(n_competencies)
        ],
    )


def test_clarification_does_not_advance_but_real_answer_does():
    analysis = make_analysis(n_competencies=2)

    call_sequence = [
        EXTRACT_RESPONSE,          # extract
        QUESTION_RESPONSE,         # ask competency 0
        IS_A_CLARIFICATION,        # user asks "what do you mean?" -> does NOT advance
        NOT_A_CLARIFICATION,       # user answers for real -> advances
        QUESTION_RESPONSE,         # ask competency 1
        NOT_A_CLARIFICATION,       # real answer -> interrogate done -> deepen
        NO_MORE_DEEPEN_RESPONSE,   # deepen: no question needed -> straight to assemble
        ASSEMBLE_START_RESPONSE,
        SECTION_COMPLETE("t"), SECTION_COMPLETE("s"), SECTION_COMPLETE("p"),
        SECTION_COMPLETE("sk"), SECTION_COMPLETE("a"), SECTION_COMPLETE("e"),
    ]

    with patch("app.services.structured_output.call_llm", side_effect=call_sequence):
        r1 = start_tailor_session(cv_text="CV " * 10, jd_text="JD " * 10, analysis=analysis)
        assert r1.phase == "interrogate"
        session_id = r1.session_id

        # User asks a clarifying question instead of answering
        r2 = continue_tailor_session(session_id, "What do you mean by that exactly?")
        assert r2.phase == "interrogate"
        assert "hands-on" in r2.agent_message.lower()  # the clarification answer

        # Now the state must NOT have advanced -- same competency 0 still pending.
        # We confirm this indirectly: the next real answer should trigger asking
        # about competency 1 (index advances exactly once from here).
        r3 = continue_tailor_session(session_id, "Yes, I have 3 years of real experience with it")
        assert r3.phase == "interrogate"  # now asking about competency 1

        r4 = continue_tailor_session(session_id, "My answer about skill 1")
        assert r4.phase in ("assemble", "complete")  # interrogate done, deepen said no more, assemble chains

    print("OK  test_clarification_does_not_advance_but_real_answer_does")


def test_full_flow_extract_through_complete():
    analysis = make_analysis(n_competencies=1)

    call_sequence = [
        EXTRACT_RESPONSE,
        QUESTION_RESPONSE,                   # ask the 1 competency
        NOT_A_CLARIFICATION,                 # real answer -> interrogate done -> deepen
        NO_MORE_DEEPEN_RESPONSE,              # deepen -> no question -> assemble
        ASSEMBLE_START_RESPONSE,
        SECTION_COMPLETE("Technical Artist | Shaders"),
        SECTION_COMPLETE("Senior Technical Artist"),
        SECTION_COMPLETE("Builds real-time pipelines."),
        SECTION_NEEDS_INFO,                                     # skills -> needs_info first try
        SECTION_COMPLETE("Unity, C#, Shader Graph"),            # skills -> retry, complete
        SECTION_COMPLETE("Built X, measured by Y, doing Z."),
        SECTION_COMPLETE("Pipeline Dev: Built X, by Y, got Z."),
    ]

    with patch("app.services.structured_output.call_llm", side_effect=call_sequence):
        r1 = start_tailor_session(cv_text="CV " * 10, jd_text="JD " * 10, analysis=analysis)
        assert r1.phase == "interrogate"
        assert r1.top_keywords == ["Unity", "Shader Graph", "C#", "Pipeline"]
        assert r1.ats_score == 72
        session_id = r1.session_id

        r2 = continue_tailor_session(session_id, "My answer about skill 1")
        assert r2.phase == "assemble"
        assert r2.positioning_reframe == "Reads as X, should read as Y."
        assert r2.sections.title == "Technical Artist | Shaders"
        assert r2.sections.skills == ""  # not yet -- needs_info
        assert "metric" in r2.agent_message.lower()

        r3 = continue_tailor_session(session_id, "We shipped 3 features 20% faster")
        assert r3.phase == "complete"
        assert r3.done is True
        assert r3.sections.skills == "Unity, C#, Shader Graph"
        assert r3.sections.achievements == "Built X, measured by Y, doing Z."
        assert r3.sections.professional_experience == "Pipeline Dev: Built X, by Y, got Z."

    print("OK  test_full_flow_extract_through_complete")


def test_max_deepen_cap_forces_assemble():
    analysis = make_analysis(n_competencies=1)

    call_sequence = [
        EXTRACT_RESPONSE,
        QUESTION_RESPONSE,           # ask the 1 competency
        NOT_A_CLARIFICATION,         # real answer -> interrogate done -> deepen asks Q1
        QUESTION_RESPONSE,           # deepen Q1
        NOT_A_CLARIFICATION,         # real answer -> deepen asks Q2
        QUESTION_RESPONSE,           # deepen Q2
        NOT_A_CLARIFICATION,         # real answer -> cap reached -> assemble chains through
        ASSEMBLE_START_RESPONSE,
        SECTION_COMPLETE("t"), SECTION_COMPLETE("s"), SECTION_COMPLETE("p"),
        SECTION_COMPLETE("sk"), SECTION_COMPLETE("a"), SECTION_COMPLETE("e"),
    ]

    with patch("app.services.structured_output.call_llm", side_effect=call_sequence):
        r1 = start_tailor_session(cv_text="CV " * 10, jd_text="JD " * 10, analysis=analysis)
        assert r1.phase == "interrogate"
        session_id = r1.session_id

        r2 = continue_tailor_session(session_id, "answer")  # ends interrogate -> asks deepen Q1
        assert r2.phase == "deepen"

        r3 = continue_tailor_session(session_id, "answer to Q1")  # deepen_count=1, asks Q2
        assert r3.phase == "deepen"

        r4 = continue_tailor_session(session_id, "answer to Q2")  # deepen_count=2, cap -> assemble chains to complete
        assert r4.phase == "complete"
        assert r4.done is True

    print("OK  test_max_deepen_cap_forces_assemble")


def test_unknown_session_raises_keyerror():
    try:
        continue_tailor_session(session_id="does-not-exist", user_message="hi")
        raise AssertionError("Should have raised KeyError")
    except KeyError:
        pass
    print("OK  test_unknown_session_raises_keyerror")


def test_fast_mode_skips_interrogate_and_deepen_entirely():
    """The whole point of fast=True: only extract + assemble calls happen,
    zero interrogate/deepen calls, no analysis needed at all."""
    call_sequence = [
        EXTRACT_RESPONSE,
        ASSEMBLE_START_RESPONSE,
        SECTION_COMPLETE("t"), SECTION_COMPLETE("s"), SECTION_COMPLETE("p"),
        SECTION_COMPLETE("sk"), SECTION_COMPLETE("a"), SECTION_COMPLETE("e"),
    ]

    with patch("app.services.structured_output.call_llm", side_effect=call_sequence) as mock_call:
        result = start_tailor_session(
            cv_text="CV " * 10, jd_text="JD " * 10, analysis=None, fast=True
        )
        assert result.phase == "complete"
        assert result.done is True
        assert result.top_keywords == ["Unity", "Shader Graph", "C#", "Pipeline"]
        assert result.sections.title == "t"
        # Exactamente 8 crides: 1 extract + 1 assemble_start + 6 seccions.
        # Cap crida d'interrogate/deepen -- confirma que s'han saltat del tot.
        assert mock_call.call_count == 8

    print("OK  test_fast_mode_skips_interrogate_and_deepen_entirely")


def test_non_fast_mode_without_analysis_raises_clean_error():
    """Sense fast=True, l'Interrogate necessita competencies -- ha de fallar
    net, no petar amb un AttributeError confús sobre analysis=None."""
    try:
        start_tailor_session(cv_text="CV " * 10, jd_text="JD " * 10, analysis=None, fast=False)
        raise AssertionError("Should have raised ValueError")
    except ValueError as exc:
        assert "fast=False" in str(exc)
    print("OK  test_non_fast_mode_without_analysis_raises_clean_error")


def test_skip_remaining_jumps_straight_to_assemble_no_clarification_call():
    """El boto 'Skip remaining questions' -- no ha de passar per la
    comprovacio d'aclariment, ha de saltar directe, sense cap crida extra."""
    analysis = make_analysis(n_competencies=3)  # 3 requirements pendents

    call_sequence = [
        EXTRACT_RESPONSE,          # extract
        QUESTION_RESPONSE,         # ask competency 0 (nomes la primera es arriba a preguntar)
        ASSEMBLE_START_RESPONSE,   # salta directe aqui en cridar skip_remaining
        SECTION_COMPLETE("t"), SECTION_COMPLETE("s"), SECTION_COMPLETE("p"),
        SECTION_COMPLETE("sk"), SECTION_COMPLETE("a"), SECTION_COMPLETE("e"),
    ]

    with patch("app.services.structured_output.call_llm", side_effect=call_sequence) as mock_call:
        r1 = start_tailor_session(cv_text="CV " * 10, jd_text="JD " * 10, analysis=analysis)
        assert r1.phase == "interrogate"
        session_id = r1.session_id

        # Encara nomes hem contestat 0 de 3 requirements -- fem servir el boto
        r2 = continue_tailor_session(session_id, user_message=None, skip_remaining=True)
        assert r2.phase == "complete"
        assert r2.done is True
        # 1 extract + 1 interrogate + 1 assemble_start + 6 seccions = 9 crides.
        # Si el skip hagues passat per la comprovacio de claredat, series 10+.
        assert mock_call.call_count == 9

    print("OK  test_skip_remaining_jumps_straight_to_assemble_no_clarification_call")


if __name__ == "__main__":
    test_clarification_does_not_advance_but_real_answer_does()
    test_full_flow_extract_through_complete()
    test_max_deepen_cap_forces_assemble()
    test_unknown_session_raises_keyerror()
    test_fast_mode_skips_interrogate_and_deepen_entirely()
    test_non_fast_mode_without_analysis_raises_clean_error()
    test_skip_remaining_jumps_straight_to_assemble_no_clarification_call()
    print("\nAll Tailor v2 tests passed.")
