"""Prova l'agent de memoria en aillament -- LLM simulat, cost zero."""

import sys
from unittest.mock import patch

sys.path.insert(0, ".")

from app.agents.memory_agent import update_user_memory  # noqa: E402


def test_update_memory_with_no_existing_memory():
    mock_response = '{"updated_memory": "First session on record: strong Python backend experience."}'
    with patch("app.services.structured_output.call_llm", return_value=mock_response) as mock_call:
        result = update_user_memory(
            existing_memory=None,
            jd_text="Python backend role",
            resume_summary="Built FastAPI services for 5 years.",
        )
        assert "Python" in result
        # Confirma que el prompt li diu explicitament que no hi ha memoria previa
        sent_message = mock_call.call_args.kwargs.get("messages") or mock_call.call_args[0][1]
        assert "No memory yet" in str(sent_message)
    print("OK  test_update_memory_with_no_existing_memory")


def test_update_memory_merges_with_existing():
    existing = "Backend engineer, strong in Python and FastAPI."
    mock_response = '{"updated_memory": "Backend engineer, strong in Python, FastAPI, and now Docker."}'
    with patch("app.services.structured_output.call_llm", return_value=mock_response) as mock_call:
        result = update_user_memory(
            existing_memory=existing,
            jd_text="DevOps role needing Docker",
            resume_summary="Containerized services with Docker for 2 years.",
        )
        assert "Docker" in result
        sent_message = str(mock_call.call_args.kwargs.get("messages") or mock_call.call_args[0][1])
        assert existing in sent_message  # la memoria antiga s'envia de veritat, no es perd
    print("OK  test_update_memory_merges_with_existing")


if __name__ == "__main__":
    test_update_memory_with_no_existing_memory()
    test_update_memory_merges_with_existing()
    print("\nAll memory agent tests passed.")
