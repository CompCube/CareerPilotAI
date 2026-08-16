"""
Emmagatzematge de sessions de conversa, en memoria.

LIMITACIO CONSCIENT (documentada al disseny): sense base de dades encara,
aixo viu nomes en memoria del proces. Si el servidor es reinicia, totes
les sessions actives es perden. Acceptable per a una demo d'una setmana;
quan hi hagi persistencia (Sprint 2), aquest modul es el que caldria
substituir per una taula a la DB -- la resta del codi (agents, rutes) no
hauria de canviar, perque nomes coneixen aquesta interficie.
"""

import uuid

_sessions: dict[str, list[dict]] = {}


def create_session() -> str:
    session_id = str(uuid.uuid4())
    _sessions[session_id] = []
    return session_id


def get_history(session_id: str) -> list[dict]:
    if session_id not in _sessions:
        raise KeyError(f"Sessio desconeguda: {session_id}")
    return _sessions[session_id]


def append_message(session_id: str, role: str, content: str) -> None:
    if session_id not in _sessions:
        raise KeyError(f"Sessio desconeguda: {session_id}")
    _sessions[session_id].append({"role": role, "content": content})
