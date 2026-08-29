"""
Prova els endpoints de perfil i historial de cap a cap amb un client HTTP
real -- cap crida a LLM aqui, es pur CRUD, aixi que tot es 100% real,
res simulat.
"""

import os
import sys
from unittest.mock import patch

sys.path.insert(0, ".")
os.environ["ANTHROPIC_API_KEY"] = "sk-ant-fake-for-boot-test"
os.environ["JWT_SECRET"] = "test-secret-not-for-production"
os.environ["GOOGLE_CLIENT_ID"] = "fake-client-id.apps.googleusercontent.com"
os.environ["DATABASE_URL"] = "sqlite:///./test_profile.db"

from fastapi.testclient import TestClient  # noqa: E402

import app.main  # noqa: E402

client = TestClient(app.main.app)

FAKE_GOOGLE_PAYLOAD = {"sub": "profile-test-user", "email": "profile@example.com", "name": "Test User"}


def get_auth_header() -> dict:
    with patch("app.api.auth_routes.verify_google_id_token", return_value=FAKE_GOOGLE_PAYLOAD):
        response = client.post("/auth/google", json={"google_id_token": "fake-token"})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_profile_starts_empty_then_can_be_updated():
    headers = get_auth_header()

    empty = client.get("/profile", headers=headers)
    assert empty.status_code == 200
    assert empty.json()["base_cv_text"] is None

    update = client.put("/profile", json={"base_cv_text": "My real base CV text."}, headers=headers)
    assert update.status_code == 200
    assert update.json()["base_cv_text"] == "My real base CV text."

    fetched_again = client.get("/profile", headers=headers)
    assert fetched_again.json()["base_cv_text"] == "My real base CV text."
    print("OK  test_profile_starts_empty_then_can_be_updated")


def test_create_and_list_and_retrieve_application():
    headers = get_auth_header()

    payload = {
        "title": "Neho — AI Product Engineer",
        "jd_text": "We need an AI product engineer...",
        "cv_text_used": "My CV text used for this application.",
        "analysis": {
            "role_summary": "Building AI agents for real estate workflows.",
            "ideal_candidate_profile": "A pragmatic engineer who ships fast.",
            "company_profile": "A Swiss real estate scale-up.",
            "competencies": [
                {
                    "competency": "Python",
                    "priority": 1,
                    "type": "screening",
                    "match_status": "match",
                    "evidence": "5 years Python experience",
                }
            ],
            "fit_score": 82,
        },
        "tailor_sections": None,
    }
    created = client.post("/applications", json=payload, headers=headers)
    assert created.status_code == 200, created.text
    app_id = created.json()["id"]
    assert created.json()["applied"] is False

    listed = client.get("/applications", headers=headers)
    assert listed.status_code == 200
    assert any(a["id"] == app_id for a in listed.json())

    detail = client.get(f"/applications/{app_id}", headers=headers)
    assert detail.status_code == 200
    assert detail.json()["analysis"]["fit_score"] == 82
    assert detail.json()["analysis"]["competencies"][0]["competency"] == "Python"
    print("OK  test_create_and_list_and_retrieve_application")


def test_cannot_access_another_users_application():
    headers_user_1 = get_auth_header()
    created = client.post(
        "/applications",
        json={"title": "Private one", "jd_text": "x", "cv_text_used": "y"},
        headers=headers_user_1,
    )
    app_id = created.json()["id"]

    with patch(
        "app.api.auth_routes.verify_google_id_token",
        return_value={"sub": "a-different-user", "email": "other@example.com", "name": "Other"},
    ):
        other_login = client.post("/auth/google", json={"google_id_token": "fake-token-2"})
    other_headers = {"Authorization": f"Bearer {other_login.json()['access_token']}"}

    response = client.get(f"/applications/{app_id}", headers=other_headers)
    assert response.status_code == 404  # no diu 403 -- no revela que existeix
    print("OK  test_cannot_access_another_users_application")


def test_profile_and_applications_require_auth():
    assert client.get("/profile").status_code == 401
    assert client.get("/applications").status_code == 401
    print("OK  test_profile_and_applications_require_auth")


def test_delete_application():
    headers = get_auth_header()
    created = client.post(
        "/applications", json={"title": "To delete", "jd_text": "x", "cv_text_used": "y"}, headers=headers
    )
    app_id = created.json()["id"]

    delete_response = client.delete(f"/applications/{app_id}", headers=headers)
    assert delete_response.status_code == 200

    get_response = client.get(f"/applications/{app_id}", headers=headers)
    assert get_response.status_code == 404
    print("OK  test_delete_application")


def test_toggle_applied():
    headers = get_auth_header()
    created = client.post(
        "/applications", json={"title": "Toggle me", "jd_text": "x", "cv_text_used": "y"}, headers=headers
    )
    app_id = created.json()["id"]
    assert created.json()["applied"] is False

    toggled = client.patch(f"/applications/{app_id}", headers=headers)
    assert toggled.json()["applied"] is True

    toggled_again = client.patch(f"/applications/{app_id}", headers=headers)
    assert toggled_again.json()["applied"] is False
    print("OK  test_toggle_applied")


def test_oldest_application_pruned_past_the_cap():
    import app.api.profile_routes as profile_routes

    headers = get_auth_header()
    original_cap = profile_routes.MAX_APPLICATIONS_PER_USER
    profile_routes.MAX_APPLICATIONS_PER_USER = 3  # cap petit per no crear 20 files de veritat
    try:
        ids = []
        for i in range(4):
            created = client.post(
                "/applications",
                json={"title": f"App {i}", "jd_text": "x", "cv_text_used": "y"},
                headers=headers,
            )
            ids.append(created.json()["id"])

        listed = client.get("/applications", headers=headers)
        listed_ids = {a["id"] for a in listed.json()}
        assert ids[0] not in listed_ids  # la primera (mes antiga) ha estat podada
        assert len(listed_ids) == 3
    finally:
        profile_routes.MAX_APPLICATIONS_PER_USER = original_cap
    print("OK  test_oldest_application_pruned_past_the_cap")


if __name__ == "__main__":
    test_profile_starts_empty_then_can_be_updated()
    test_create_and_list_and_retrieve_application()
    test_cannot_access_another_users_application()
    test_profile_and_applications_require_auth()
    test_delete_application()
    test_toggle_applied()
    test_oldest_application_pruned_past_the_cap()
    print("\nAll profile/applications tests passed.")
    os.remove("test_profile.db")
