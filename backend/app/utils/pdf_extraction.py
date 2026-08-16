"""
Extraccio de text de PDFs (CV / job description).

Fem servir pypdf perque els CVs i JDs son documents de text seleccionable
(no escanejats), on l'extraccio directa es fiable i barata. Si algun dia
calgues suportar PDFs escanejats (nomes imatge), caldria afegir OCR --
fora d'abast per ara, i ho detectem explicitament en lloc de fallar en
silenci amb text buit.
"""

import io

from pypdf import PdfReader

MIN_EXTRACTABLE_CHARS = 20


class PDFExtractionError(Exception):
    """El PDF no conte text extraible (probablement escanejat) o esta corrupte."""


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
    except Exception as exc:
        raise PDFExtractionError(f"No s'ha pogut llegir el PDF: {exc}") from exc

    text_parts = [page.extract_text() or "" for page in reader.pages]
    full_text = "\n".join(text_parts).strip()

    if len(full_text) < MIN_EXTRACTABLE_CHARS:
        raise PDFExtractionError(
            "The PDF has no extractable text -- it may be a scanned document "
            "(image) instead of selectable text. Try pasting the text manually."
        )

    return full_text
