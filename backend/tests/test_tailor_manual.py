"""
Manual test of the full Tailor v2 state machine -- mocked LLM, zero real cost.

Exercises: extract -> interrogate (N competencies) -> deepen (up to cap) ->
assemble (6 sections, one needs_info mid-way) -> complete.
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

QUESTION_RESPONSE = '{"has_question": true, "agent_message": "Tell me about your experience with X."}'
NO_MORE_DEEPEN_RESPONSE = '{"has_question": false, "agent_message": ""}'

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


def test_full_flow_extract_through_complete():
    analysis = make_analysis(n_competencies=2)

    call_sequence = [
        EXTRACT_RESPONSE,                    # extract
        QUESTION_RESPONSE,                   # interrogate competency 1
        QUESTION_RESPONSE,                   # interrogate competency 2
        NO_MORE_DEEPEN_RESPONSE,             # deepen -> no question needed, straight to assemble
        ASSEMBLE_START_RESPONSE,             # assemble start
        SECTION_COMPLETE("Technical Artist | Shaders"),        # title
        SECTION_COMPLETE("Senior Technical Artist"),            # subtitle
        SECTION_COMPLETE("Builds real-time pipelines."),        # professional_summary
        SECTION_NEEDS_INFO,                                     # skills -> needs_info first try
        SECTION_COMPLETE("Unity, C#, Shader Graph"),            # skills -> retry, complete
        SECTION_COMPLETE("Built X, measured by Y, doing Z."),   # achievements
        SECTION_COMPLETE("Pipeline Dev: Built X, by Y, got Z."),# professional_experience
    ]

    with patch("app.services.structured_output.call_llm", side_effect=call_sequence):
        # Phase A -> B (first question)
        r1 = start_tailor_session(cv_text="CV " * 10, jd_text="JD " * 10, analysis=analysis)
        assert r1.phase == "interrogate"
        assert r1.top_keywords == ["Unity", "Shader Graph", "C#", "Pipeline"]
        assert r1.ats_score == 72
        assert len(r1.ats_issues) == 1
        session_id = r1.session_id

        # Interrogate competency 2
        r2 = continue_tailor_session(session_id, "My answer about skill 1")
        assert r2.phase == "interrogate"

        # Interrogate done -> deepen -> no question needed -> assemble starts immediately
        r3 = continue_tailor_session(session_id, "My answer about skill 2")
        assert r3.phase == "assemble"
        assert r3.positioning_reframe == "Reads as X, should read as Y."
        assert r3.sections.achievements_label == "projects"
        # Chained through title, subtitle, summary, and hit needs_info on skills
        assert r3.sections.title == "Technical Artist | Shaders"
        assert r3.sections.professional_summary == "Builds real-time pipelines."
        assert r3.sections.skills == ""  # not yet -- needs_info
        assert "metric" in r3.agent_message.lower()

        # Answer the needs_info question -> retries skills, then chains to the end
        r4 = continue_tailor_session(session_id, "We shipped 3 features 20% faster")
        assert r4.phase == "complete"
        assert r4.done is True
        assert r4.sections.skills == "Unity, C#, Shader Graph"
        assert r4.sections.achievements == "Built X, measured by Y, doing Z."
        assert r4.sections.professional_experience == "Pipeline Dev: Built X, by Y, got Z."

    print("OK  test_full_flow_extract_through_complete")


def test_max_deepen_cap_forces_assemble():
    analysis = make_analysis(n_competencies=1)

    call_sequence = [
        EXTRACT_RESPONSE,
        QUESTION_RESPONSE,           # interrogate the 1 competency
        QUESTION_RESPONSE,           # deepen Q1 (has_question=true)
        QUESTION_RESPONSE,           # deepen Q2 (has_question=true) -- cap=2 reached after this is answered
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

        r4 = continue_tailor_session(session_id, "answer to Q2")  # deepen_count=2, cap reached -> assemble chains straight through to complete
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


if __name__ == "__main__":
    test_full_flow_extract_through_complete()
    test_max_deepen_cap_forces_assemble()
    test_unknown_session_raises_keyerror()
    print("\nAll Tailor v2 tests passed.")
