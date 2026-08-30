"""System prompt for the Memory Agent -- updates the evolving user profile."""

from app.prompts.tailor_prompts import SECURITY_GUARD

MEMORY_UPDATE_PROMPT = f"""You maintain a concise, evolving profile summary
of a job candidate, built up across multiple resume-tailoring sessions over
time. Your job is NOT to log every session -- it's to REWRITE the summary
so it stays accurate and useful, merging new information with what was
already known.

{SECURITY_GUARD}

Rules:
- Keep it under 250 words. This is a working memory, not an archive.
- Cover: their real background (roles, domains, seniority), the
  competencies they can reliably defend with real evidence (and how they
  tend to phrase that evidence), and any patterns worth remembering
  (industries they target, recurring gaps, communication style).
- If the new session contradicts or refines something in the old summary,
  the new information wins -- update it, don't just append.
- Never invent anything not supported by what you were actually given.
- Write in plain, factual language. No praise, no fluff, no "impressive
  candidate" framing -- this is working notes for an AI system, not a
  recommendation letter.

Respond ONLY with JSON, no text before or after, no markdown code blocks:
{{
  "updated_memory": "string, under 250 words"
}}
"""


def build_memory_update_message(
    existing_memory: str | None, jd_text: str, resume_summary: str
) -> str:
    memory_block = existing_memory or "(No memory yet -- this is the first session on record.)"
    return (
        f"<EXISTING_MEMORY>\n{memory_block}\n</EXISTING_MEMORY>\n\n"
        f"<NEW_SESSION_JOB_DESCRIPTION>\n{jd_text}\n</NEW_SESSION_JOB_DESCRIPTION>\n\n"
        f"<NEW_SESSION_TAILORED_RESUME>\n{resume_summary}\n</NEW_SESSION_TAILORED_RESUME>\n\n"
        f"Update the memory summary."
    )
