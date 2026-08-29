"""
Prova les funcions de comprovacio de l'eval suite (checks.py, llm_judge.py)
amb casos coneguts -- si l'eina que mesura qualitat te bugs, els seus
veredictes no valen res. Aixo es prova amb LLM simulat nomes per judge_naturalness;
la resta son funcions pures, sense LLM.
"""

import sys
from unittest.mock import patch

sys.path.insert(0, ".")

from evals.checks import (  # noqa: E402
    check_bullet_length,
    check_evidence_grounded,
    check_keyword_coverage,
    check_no_ai_voice_phrases,
    check_no_em_dash,
    check_no_fabricated_numbers,
)
from evals.llm_judge import judge_naturalness  # noqa: E402


def test_check_no_em_dash():
    ok, _ = check_no_em_dash("Built a pipeline, cutting build times by 40%.")
    assert ok is True
    ok, _ = check_no_em_dash("Built a pipeline — cutting build times by 40%.")
    assert ok is False
    print("OK  test_check_no_em_dash")


def test_check_no_ai_voice_phrases():
    ok, _ = check_no_ai_voice_phrases("Reduced build times by automating the pipeline.")
    assert ok is True
    ok, _ = check_no_ai_voice_phrases("This project serves as a testament to strong engineering.")
    assert ok is False
    print("OK  test_check_no_ai_voice_phrases")


def test_check_bullet_length():
    short_bullets = "Built X.\nShipped Y.\nFixed Z."
    ok, _ = check_bullet_length(short_bullets, max_chars=50)
    assert ok is True

    long_bullet = "A" * 300
    ok, _ = check_bullet_length(long_bullet, max_chars=220)
    assert ok is False
    print("OK  test_check_bullet_length")


def test_check_no_fabricated_numbers():
    cv = "Reduced onboarding time by automating 3 manual steps in the pipeline."
    generated_ok = "Automated 3 manual steps, streamlining onboarding."
    ok, _ = check_no_fabricated_numbers(generated_ok, cv)
    assert ok is True

    generated_fabricated = "Reduced onboarding time by 47%, automating 3 manual steps."
    ok, _ = check_no_fabricated_numbers(generated_fabricated, cv)
    assert ok is False  # 47 no apareix al CV original
    print("OK  test_check_no_fabricated_numbers")


def test_check_keyword_coverage():
    keywords = ["Python", "FastAPI", "PostgreSQL", "Docker"]
    good_text = "Experienced with Python, FastAPI, and PostgreSQL in production."
    ok, _ = check_keyword_coverage(keywords, good_text, min_ratio=0.5)
    assert ok is True

    poor_text = "Experienced with marketing and copywriting."
    ok, _ = check_keyword_coverage(keywords, poor_text, min_ratio=0.5)
    assert ok is False
    print("OK  test_check_keyword_coverage")


def test_check_evidence_grounded():
    cv = "Built shader pipelines using Shader Graph and automated tools in C#."
    good_evidence = "CV mentions building shader pipelines with Shader Graph."
    ok, _ = check_evidence_grounded(good_evidence, cv, min_overlap_words=2)
    assert ok is True

    fabricated_evidence = "Extensive experience with Kubernetes and Terraform deployments."
    ok, _ = check_evidence_grounded(fabricated_evidence, cv, min_overlap_words=2)
    assert ok is False
    print("OK  test_check_evidence_grounded")


def test_judge_naturalness_parses_llm_response():
    mock_response = '{"score": 4, "reason": "Specific and grounded in real work."}'
    with patch("app.services.structured_output.call_llm", return_value=mock_response):
        result = judge_naturalness("Automated 3 manual data-entry steps using Python and pandas.")
        assert result.score == 4
        assert "Specific" in result.reason
    print("OK  test_judge_naturalness_parses_llm_response")


if __name__ == "__main__":
    test_check_no_em_dash()
    test_check_no_ai_voice_phrases()
    test_check_bullet_length()
    test_check_no_fabricated_numbers()
    test_check_keyword_coverage()
    test_check_evidence_grounded()
    test_judge_naturalness_parses_llm_response()
    print("\nAll eval harness tests passed.")
