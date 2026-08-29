"""
Prova el flux d'auth de cap a cap amb un client HTTP real contra la nostra
app -- l'unica cosa simulada es la verificacio del token de Google (no
podem generar un token real de Google des d'aqui), tota la resta (JWT
propi, base de dades, endpoint protegit) es codi real, executat de veritat.
"""

import os
import sys
from unittest.mock import patch

sys.path.insert(0, ".")
os.environ["ANTHROPIC_API_KEY"] = "sk-ant-fake-for-boot-test"
os.environ["JWT_SECRET"] = "test-secret-not-for-production"
os.environ["GOOGLE_CLIENT_ID"] = "fake-client-id.apps.googleusercontent.com"
os.environ["DATABASE_URL"] = "sqlite:///./test_auth.db"

from fastapi.testclient import TestClient  # noqa: E402

import app.main  # noqa: E402

client = TestClient(app.main.app)

FAKE_GOOGLE_PAYLOAD = {
    "sub": "1234567890",
    "email": "jordi@example.com",
    "name": "Jordi Altisen",
}


def test_login_creates_user_and_issues_working_token():
    with patch("app.api.auth_routes.verify_google_id_token", return_value=FAKE_GOOGLE_PAYLOAD):
        response = client.post("/auth/google", json={"google_id_token": "fake-token"})
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["user"]["email"] == "jordi@example.com"
    token = data["access_token"]
    assert token

    # El token real ha de funcionar contra l'endpoint protegit
    me_response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "jordi@example.com"
    print("OK  test_login_creates_user_and_issues_working_token")


def test_login_twice_reuses_same_user_not_duplicated():
    with patch("app.api.auth_routes.verify_google_id_token", return_value=FAKE_GOOGLE_PAYLOAD):
        r1 = client.post("/auth/google", json={"google_id_token": "fake-token"})
        r2 = client.post("/auth/google", json={"google_id_token": "fake-token"})
    assert r1.json()["user"]["id"] == r2.json()["user"]["id"]
    print("OK  test_login_twice_reuses_same_user_not_duplicated")


def test_protected_endpoint_rejects_missing_token():
    response = client.get("/auth/me")
    assert response.status_code == 401
    print("OK  test_protected_endpoint_rejects_missing_token")


def test_protected_endpoint_rejects_garbage_token():
    response = client.get("/auth/me", headers={"Authorization": "Bearer not-a-real-jwt"})
    assert response.status_code == 401
    print("OK  test_protected_endpoint_rejects_garbage_token")


if __name__ == "__main__":
    test_login_creates_user_and_issues_working_token()
    test_login_twice_reuses_same_user_not_duplicated()
    test_protected_endpoint_rejects_missing_token()
    test_protected_endpoint_rejects_garbage_token()
    print("\nAll auth tests passed.")
    os.remove("test_auth.db")
