"""
Eval suite runner. FA CRIDES REALS A L'API -- a diferencia de backend/tests/
(LLM simulat), aixo mesura qualitat de sortida real, no logica de codi.

Execucio: cd backend && python evals/run_evals.py
Requereix ANTHROPIC_API_KEY real a .env -- costa cèntims, no cap crèdit
significatiu (uns 10-15 crides a Haiku en total).
"""

import sys
from datetime import datetime, timezone

sys.path.insert(0, ".")

from app.agents.analyzer_agent import run_analyzer  # noqa: E402
from app.agents.tailor_agent import start_tailor_session  # noqa: E402
from evals.checks import (  # noqa: E402
    check_bullet_length,
    check_evidence_grounded,
    check_keyword_coverage,
    check_no_ai_voice_phrases,
    check_no_em_dash,
    check_no_fabricated_numbers,
)
from evals.golden_cases import (  # noqa: E402
    ANALYZER_CASES,
    FIT_SCORE_JD,
    FIT_SCORE_STRONG_CV,
    FIT_SCORE_WEAK_CV,
    TAILOR_CASES,
)
from evals.llm_judge import judge_naturalness  # noqa: E402

results: list[dict] = []


def record(case_name: str, check_name: str, passed: bool, detail: str) -> None:
    results.append({"case": case_name, "check": check_name, "passed": passed, "detail": detail})
    status = "PASS" if passed else "FAIL"
    print(f"  [{status}] {check_name}: {detail}")


def run_analyzer_cases() -> None:
    print("\n=== Analyzer cases ===")
    for case in ANALYZER_CASES:
        print(f"\n{case.name} -- expect: {case.expect}")
        analysis = run_analyzer(cv_text=case.cv_text, jd_text=case.jd_text)

        if case.name == "clear_match":
            comp = next((c for c in analysis.competencies if "python" in c.competency.lower()), None)
            ok = comp is not None and comp.match_status == "match"
            record(case.name, "python_is_match", ok, f"found={comp.match_status if comp else 'none'}")

        elif case.name == "clear_gap":
            comp = next((c for c in analysis.competencies if "kubernetes" in c.competency.lower()), None)
            ok = comp is not None and comp.match_status == "gap"
            record(case.name, "kubernetes_is_gap", ok, f"found={comp.match_status if comp else 'none'}")

        elif case.name == "partial_adjacent":
            comp = next((c for c in analysis.competencies if "fastapi" in c.competency.lower()), None)
            ok = comp is not None and comp.match_status == "partial"
            record(case.name, "fastapi_is_partial", ok, f"found={comp.match_status if comp else 'none'}")

        elif case.name == "no_fabricated_evidence_strong_fit":
            for comp in analysis.competencies:
                passed, detail = check_evidence_grounded(comp.evidence, case.cv_text)
                record(case.name, f"evidence_grounded[{comp.competency}]", passed, detail)


def run_fit_score_ordering() -> None:
    print("\n=== Fit score ordering ===")
    strong = run_analyzer(cv_text=FIT_SCORE_STRONG_CV, jd_text=FIT_SCORE_JD)
    weak = run_analyzer(cv_text=FIT_SCORE_WEAK_CV, jd_text=FIT_SCORE_JD)
    ok = strong.fit_score > weak.fit_score
    record(
        "fit_score_ordering",
        "strong_cv_scores_higher",
        ok,
        f"strong={strong.fit_score}, weak={weak.fit_score}",
    )


def run_tailor_cases() -> None:
    print("\n=== Tailor cases (fast mode) ===")
    first_bullet_for_judge: str | None = None

    for case in TAILOR_CASES:
        print(f"\n{case.name} -- expect: {case.expect}")
        result = start_tailor_session(cv_text=case.cv_text, jd_text=case.jd_text, analysis=None, fast=True)
        sections = result.sections
        combined = "\n".join(
            [sections.professional_summary, sections.achievements, sections.professional_experience]
        )

        # Comprovacions universals a TOTS els casos de Tailor
        passed, detail = check_no_em_dash(combined)
        record(case.name, "no_em_dash", passed, detail)
        passed, detail = check_no_ai_voice_phrases(combined)
        record(case.name, "no_ai_voice_phrases", passed, detail)

        if case.name == "no_fabrication_missing_metric":
            passed, detail = check_no_fabricated_numbers(
                sections.professional_experience + sections.achievements, case.cv_text
            )
            record(case.name, "no_fabricated_numbers", passed, detail)
            first_bullet_for_judge = sections.professional_experience.split("\n")[0]

        elif case.name == "bullet_length_and_formatting":
            passed, detail = check_bullet_length(sections.professional_experience)
            record(case.name, "experience_bullet_length", passed, detail)
            passed, detail = check_bullet_length(sections.achievements)
            record(case.name, "achievements_bullet_length", passed, detail)

        elif case.name == "keyword_integration":
            passed, detail = check_keyword_coverage(result.top_keywords, combined)
            record(case.name, "keyword_coverage", passed, detail)

    if first_bullet_for_judge:
        print("\n=== LLM-as-judge (naturalness, 1 sample) ===")
        judged = judge_naturalness(first_bullet_for_judge)
        print(f"  Bullet: {first_bullet_for_judge}")
        print(f"  Score: {judged.score}/5 -- {judged.reason}")
        results.append(
            {
                "case": "no_fabrication_missing_metric",
                "check": "llm_judge_naturalness",
                "passed": judged.score >= 3,
                "detail": f"score={judged.score}/5, reason={judged.reason}",
            }
        )


def write_report() -> None:
    total = len(results)
    passed = sum(1 for r in results if r["passed"])
    lines = [
        "# Eval Report",
        f"Run at: {datetime.now(timezone.utc).isoformat()}",
        f"Result: {passed}/{total} checks passed ({passed/total:.0%})" if total else "No checks ran",
        "",
        "| Case | Check | Result | Detail |",
        "|---|---|---|---|",
    ]
    for r in results:
        status = "PASS" if r["passed"] else "FAIL"
        lines.append(f"| {r['case']} | {r['check']} | {status} | {r['detail']} |")
    with open("evals/report.md", "w") as f:
        f.write("\n".join(lines))
    print(f"\n{'='*50}\n{passed}/{total} checks passed ({passed/total:.0%})\nReport written to evals/report.md")


if __name__ == "__main__":
    run_analyzer_cases()
    run_fit_score_ordering()
    run_tailor_cases()
    write_report()
